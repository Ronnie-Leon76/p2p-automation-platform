import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

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

export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const userAgent = headersList.get("user-agent") || ""
    const contentType = headersList.get("content-type") || ""

    // Verify the request is from Safaricom
    if (!userAgent.includes("Java") && !userAgent.includes("Apache-HttpClient")) {
      console.warn("Suspicious M-Pesa webhook request - invalid user agent:", userAgent)
    }

    const body = await request.json()
    const supabase = createServerClient()

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
      const supabase = createServerClient()
      await supabase.from("webhook_logs").insert({
        provider_id: "mpesa",
        webhook_type: "error",
        payload: { error: error instanceof Error ? error.message : "Unknown error" },
        headers: Object.fromEntries(headers().entries()),
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

  // Update order status if payment was successful
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

    // TODO: Trigger order completion workflow
    // - Notify seller that payment is confirmed
    // - Update exchange order status
    // - Send notifications to relevant parties
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
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "mpesa-webhook",
    timestamp: new Date().toISOString(),
  })
}