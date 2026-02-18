import type { BackendDatabaseClient } from "@/lib/ports/backend-database-port"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

interface MPesaSTKCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{
          Name: string
          Value: string | number
        }>
      }
    }
  }
}

interface MPesaC2BCallback {
  TransactionType: string
  TransID: string
  TransTime: string
  TransAmount: string
  BusinessShortCode: string
  BillRefNumber: string
  InvoiceNumber: string
  OrgAccountBalance: string
  ThirdPartyTransID: string
  MSISDN: string
  FirstName: string
  MiddleName: string
  LastName: string
}

interface MPesaValidationRequest {
  TransactionType: string
  TransID: string
  TransTime: string
  TransAmount: string
  BusinessShortCode: string
  BillRefNumber: string
  MSISDN: string
  FirstName: string
  MiddleName: string
  LastName: string
}

export async function handleMPesaWebhookPost(request: NextRequest, supabase: BackendDatabaseClient) {
  try {
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || ""
    const contentType = headersList.get("content-type") || ""

    // Verify the request is from Safaricom
    if (!userAgent.includes("Java") && !userAgent.includes("Apache-HttpClient")) {
      console.warn("Suspicious M-Pesa webhook request - invalid user agent:", userAgent)
    }

    const body = await request.json()

    // Log all webhook requests for debugging and audit
    const webhookLog = await supabase
      .from("webhook_logs")
      .insert({
        provider_id: "mpesa",
        webhook_type: determineWebhookType(body),
        payload: body,
        headers: Object.fromEntries(headersList.entries()),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    console.log("M-Pesa webhook received:", {
      type: determineWebhookType(body),
      logId: webhookLog.data?.id,
    })

    // Handle different types of M-Pesa callbacks
    if (body.Body?.stkCallback) {
      return await handleSTKCallback(body as MPesaSTKCallback, supabase)
    } else if (body.TransactionType && body.TransID) {
      // Check if it's a validation or confirmation request
      const isValidation = request.url.includes("/validation")
      if (isValidation) {
        return await handleValidationRequest(body as MPesaValidationRequest, supabase)
      } else {
        return await handleC2BConfirmation(body as MPesaC2BCallback, supabase)
      }
    } else {
      console.error("Unknown M-Pesa webhook format:", body)
      return NextResponse.json(
        {
          ResultCode: 1,
          ResultDesc: "Unknown webhook format",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("M-Pesa webhook error:", error)

    // Log the error
    try {
      const headersList = await headers()
      await supabase.from("webhook_logs").insert({
        provider_id: "mpesa",
        webhook_type: "error",
        payload: { error: error instanceof Error ? error.message : "Unknown error" },
        headers: Object.fromEntries(headersList.entries()),
        error_message: error instanceof Error ? error.message : "Unknown error",
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error("Failed to log webhook error:", logError)
    }

    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: "Internal server error",
      },
      { status: 500 },
    )
  }
}

function determineWebhookType(body: any): string {
  if (body.Body?.stkCallback) return "stk_callback"
  if (body.TransactionType === "Pay Bill") return "c2b_confirmation"
  if (body.TransactionType === "Buy Goods") return "c2b_confirmation"
  if (body.TransID && !body.Body) return "c2b_validation"
  return "unknown"
}

async function handleSTKCallback(data: MPesaSTKCallback, supabase: any) {
  const { stkCallback } = data.Body
  const { CheckoutRequestID, ResultCode, ResultDesc, MerchantRequestID } = stkCallback

  console.log("Processing STK callback:", {
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    MerchantRequestID,
  })

  // Find transaction by external ID
  const { data: transaction, error: findError } = await supabase
    .from("payment_transactions")
    .select(`
      *,
      orders(*)
    `)
    .eq("external_transaction_id", CheckoutRequestID)
    .single()

  if (findError || !transaction) {
    console.error("Transaction not found for CheckoutRequestID:", CheckoutRequestID, findError)

    // Log orphaned callback
    await supabase.from("webhook_logs").insert({
      provider_id: "mpesa",
      webhook_type: "orphaned_stk_callback",
      payload: data,
      error_message: `Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  }

  let status = "failed"
  let completedAt = null
  let metadata: any = { ...transaction.metadata }

  if (ResultCode === 0) {
    // Payment successful
    status = "completed"
    completedAt = new Date().toISOString()

    // Extract callback metadata
    if (stkCallback.CallbackMetadata?.Item) {
      const callbackData: any = {}

      stkCallback.CallbackMetadata.Item.forEach((item) => {
        switch (item.Name) {
          case "Amount":
            callbackData.amount_paid = Number.parseFloat(item.Value.toString())
            break
          case "MpesaReceiptNumber":
            callbackData.receipt_number = item.Value.toString()
            break
          case "TransactionDate":
            callbackData.transaction_date = item.Value.toString()
            break
          case "PhoneNumber":
            callbackData.phone_number = item.Value.toString()
            break
          case "Balance":
            callbackData.account_balance = item.Value.toString()
            break
        }
      })

      metadata = { ...metadata, ...callbackData }
    }

    console.log("STK Push successful:", {
      transactionId: transaction.id,
      receiptNumber: metadata.receipt_number,
      amount: metadata.amount_paid,
    })
  } else {
    // Payment failed
    console.log("STK Push failed:", {
      transactionId: transaction.id,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
    })

    metadata.failure_reason = ResultDesc
    metadata.result_code = ResultCode
  }

  // Update transaction
  const { error: updateError } = await supabase
    .from("payment_transactions")
    .update({
      status,
      completed_at: completedAt,
      reference_number: metadata.receipt_number || null,
      webhook_data: data,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction.id)

  if (updateError) {
    console.error("Failed to update transaction:", updateError)
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: "Failed to update transaction",
    })
  }

  // Implement order completion workflow
  if (status === "completed" && transaction.orders) {
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.order_id)

    if (orderError) {
      console.error("Failed to update order status:", orderError)
    } else {
      console.log("Order payment status updated:", transaction.order_id)
    }

    // Trigger order completion workflow
    await triggerOrderCompletionWorkflow(transaction, supabase)
  }

  async function triggerOrderCompletionWorkflow(transaction: any, supabase: any) {
    try {
      const order = transaction.orders

      // 1. Notify seller that payment is confirmed
      await notifySeller(order, transaction, supabase)

      // 2. Update exchange order status
      await updateExchangeOrderStatus(order, supabase)

      // 3. Send notifications to relevant parties
      await sendNotificationsToParties(order, transaction, supabase)

      console.log("Order completion workflow triggered successfully for order:", order.id)
    } catch (error) {
      console.error("Order completion workflow failed:", error)
      
      // Safely handle error of type unknown
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log the workflow failure
      await supabase.from("webhook_logs").insert({
        provider_id: "mpesa",
        webhook_type: "workflow_error",
        payload: { orderId: transaction.order_id, error: errorMessage },
        error_message: `Workflow failed: ${errorMessage}`,
        created_at: new Date().toISOString(),
      })
    }
  }

  async function notifySeller(order: any, transaction: any, supabase: any) {
    // Get seller information
    const { data: seller } = await supabase
      .from("users")
      .select("id, email, phone, notification_preferences")
      .eq("id", order.seller_id)
      .single()

    if (!seller) return

    // Create notification record
    await supabase.from("notifications").insert({
      user_id: seller.id,
      type: "payment_confirmed",
      title: "Payment Confirmed",
      message: `Payment of ${transaction.amount} ${transaction.currency} has been confirmed for order ${order.id}`,
      data: {
        order_id: order.id,
        transaction_id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        receipt_number: transaction.reference_number,
      },
      created_at: new Date().toISOString(),
    })

    // Send email notification if enabled
    if (seller.notification_preferences?.email_enabled) {
      // TODO: Integrate with email service (SendGrid, Resend, etc.)
      console.log("Email notification sent to seller:", seller.email)
    }

    // Send SMS notification if enabled
    if (seller.notification_preferences?.sms_enabled && seller.phone) {
      // TODO: Integrate with SMS service (Twilio, Africa's Talking, etc.)
      console.log("SMS notification sent to seller:", seller.phone)
    }
  }

  async function updateExchangeOrderStatus(order: any, supabase: any) {
    try {
      // Get team credentials for exchange API calls
      const { data: teamCredentials } = await supabase
        .from("team_exchange_credentials")
        .select("*")
        .eq("team_id", order.team_id)
        .eq("exchange_name", order.exchange)
        .single()

      if (!teamCredentials) {
        console.log("No team credentials found for exchange:", order.exchange)
        return
      }

      // Update exchange order status based on exchange type
      switch (order.exchange) {
        case "okx":
          await updateOKXOrderStatus(order, teamCredentials)
          break
        case "binance":
          await updateBinanceOrderStatus(order, teamCredentials)
          break
        case "bybit":
          await updateBybitOrderStatus(order, teamCredentials)
          break
        default:
          console.log("Unsupported exchange:", order.exchange)
      }
    } catch (error) {
      console.error("Failed to update exchange order status:", error)
    }
  }

  async function updateOKXOrderStatus(order: any, credentials: any) {
    // TODO: Implement OKX API call to mark order as paid
    console.log("Updating OKX order status:", order.external_order_id)

    // Example API call structure:
    // const okxApi = new OKXExchange(credentials.api_key, credentials.api_secret, credentials.passphrase)
    // await okxApi.markOrderAsPaid(order.external_order_id)
  }

  async function updateBinanceOrderStatus(order: any, credentials: any) {
    // TODO: Implement Binance API call to mark order as paid
    console.log("Updating Binance order status:", order.external_order_id)
  }

  async function updateBybitOrderStatus(order: any, credentials: any) {
    // TODO: Implement Bybit API call to mark order as paid
    console.log("Updating Bybit order status:", order.external_order_id)
  }

  async function sendNotificationsToParties(order: any, transaction: any, supabase: any) {
    // Get all team members who should be notified
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select(`
        user_id,
        role,
        users(id, email, phone, notification_preferences)
      `)
      .eq("team_id", order.team_id)
      .eq("status", "active")

    if (!teamMembers) return

    // Notify relevant team members
    for (const member of teamMembers) {
      const user = member.users

      // Only notify if user has permission to view orders
      if (member.role === "admin" || member.role === "trader") {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "team_payment_confirmed",
          title: "Team Payment Confirmed",
          message: `Payment confirmed for team order ${order.id}`,
          data: {
            order_id: order.id,
            transaction_id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            team_role: member.role,
          },
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  // Send real-time updates via Supabase realtime
  await supabase.from("payment_transactions").update({ updated_at: new Date().toISOString() }).eq("id", transaction.id)

  return NextResponse.json({
    ResultCode: 0,
    ResultDesc: "Success",
  })
}

async function handleC2BConfirmation(data: MPesaC2BCallback, supabase: any) {
  const {
    TransID,
    TransTime,
    TransAmount,
    BusinessShortCode,
    BillRefNumber,
    MSISDN,
    FirstName,
    MiddleName,
    LastName,
    TransactionType,
  } = data

  console.log("Processing C2B confirmation:", {
    TransID,
    BillRefNumber,
    TransAmount,
    MSISDN,
  })

  // Try to find transaction by bill reference number (should be our transaction ID)
  const { data: transaction, error: findError } = await supabase
    .from("payment_transactions")
    .select(`
      *,
      orders(*)
    `)
    .eq("id", BillRefNumber)
    .single()

  if (findError || !transaction) {
    console.log("No matching transaction found for BillRefNumber:", BillRefNumber)

    // Create a new transaction record for unmatched C2B payments
    const { data: newTransaction, error: createError } = await supabase
      .from("payment_transactions")
      .insert({
        external_transaction_id: TransID,
        transaction_type: "c2b_payment",
        amount: Number.parseFloat(TransAmount),
        currency: "KES",
        status: "completed",
        payment_method: "mpesa",
        payer_phone: MSISDN,
        payer_name: `${FirstName} ${MiddleName || ""} ${LastName}`.trim(),
        reference_number: TransID,
        description: `Unmatched C2B payment - ${TransactionType}`,
        metadata: {
          transaction_type: TransactionType,
          business_shortcode: BusinessShortCode,
          transaction_time: TransTime,
          bill_ref_number: BillRefNumber,
        },
        webhook_data: data,
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        team_id: null, // Will need manual assignment
        provider_id: "mpesa", // Default M-Pesa provider
      })
      .select()
      .single()

    if (createError) {
      console.error("Failed to create unmatched transaction:", createError)
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: "Failed to process payment",
      })
    }

    console.log("Created unmatched C2B transaction:", newTransaction.data?.id)

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    })
  }

  // Update existing transaction
  const { error: updateError } = await supabase
    .from("payment_transactions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      reference_number: TransID,
      payer_phone: MSISDN,
      payer_name: `${FirstName} ${MiddleName || ""} ${LastName}`.trim(),
      webhook_data: data,
      metadata: {
        ...transaction.metadata,
        transaction_type: TransactionType,
        business_shortcode: BusinessShortCode,
        transaction_time: TransTime,
        confirmed_amount: Number.parseFloat(TransAmount),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction.id)

  if (updateError) {
    console.error("Failed to update C2B transaction:", updateError)
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: "Failed to update transaction",
    })
  }

  // Update order status
  if (transaction.orders) {
    await supabase
      .from("orders")
      .update({
        payment_status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.order_id)

    console.log("C2B payment confirmed for order:", transaction.order_id)
  }

  return NextResponse.json({
    ResultCode: 0,
    ResultDesc: "Success",
  })
}

async function handleValidationRequest(data: MPesaValidationRequest, supabase: any) {
  const { TransID, TransAmount, BillRefNumber, MSISDN, FirstName, LastName } = data

  console.log("Processing C2B validation:", {
    TransID,
    BillRefNumber,
    TransAmount,
    MSISDN,
  })

  // Validation logic - check if the payment should be accepted
  try {
    // Check if bill reference number exists in our system
    if (BillRefNumber) {
      const { data: transaction } = await supabase
        .from("payment_transactions")
        .select("id, amount, status")
        .eq("id", BillRefNumber)
        .single()

      if (transaction) {
        // Validate amount matches
        const expectedAmount = transaction.amount
        const receivedAmount = Number.parseFloat(TransAmount)

        if (Math.abs(expectedAmount - receivedAmount) > 1) {
          // Allow 1 KES tolerance
          console.log("Amount mismatch:", { expected: expectedAmount, received: receivedAmount })
          return NextResponse.json({
            ResultCode: "C2B00012",
            ResultDesc: "Invalid amount",
          })
        }

        // Check if transaction is still pending
        if (transaction.status !== "pending" && transaction.status !== "processing") {
          console.log("Transaction not in valid state:", transaction.status)
          return NextResponse.json({
            ResultCode: "C2B00013",
            ResultDesc: "Transaction already processed",
          })
        }
      }
    }

    // Additional validation rules
    const amount = Number.parseFloat(TransAmount)

    // Minimum amount validation
    if (amount < 10) {
      return NextResponse.json({
        ResultCode: "C2B00011",
        ResultDesc: "Amount too small",
      })
    }

    // Maximum amount validation (adjust as needed)
    if (amount > 1000000) {
      return NextResponse.json({
        ResultCode: "C2B00014",
        ResultDesc: "Amount exceeds limit",
      })
    }

    // Phone number validation (basic)
    if (!MSISDN || MSISDN.length < 10) {
      return NextResponse.json({
        ResultCode: "C2B00015",
        ResultDesc: "Invalid phone number",
      })
    }

    // Log successful validation
    await supabase.from("webhook_logs").insert({
      provider_id: "mpesa",
      webhook_type: "c2b_validation_success",
      payload: data,
      created_at: new Date().toISOString(),
    })

    console.log("C2B validation successful:", TransID)

    return NextResponse.json({
      ResultCode: "0",
      ResultDesc: "Accepted",
    })
  } catch (error) {
    console.error("C2B validation error:", error)

    return NextResponse.json({
      ResultCode: "C2B00016",
      ResultDesc: "Validation failed",
    })
  }
}

// Handle GET requests for health checks
export async function handleMPesaWebhookGet() {
  return NextResponse.json({
    status: "ok",
    service: "mpesa-webhook",
    timestamp: new Date().toISOString(),
  })
}
