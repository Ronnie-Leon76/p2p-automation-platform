import { P2POrderManager } from "@/lib/payments/p2p-order-manager"
import { createServerClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

interface SasaPayCallback {
  transaction_id?: string
  amount?: number
  currency?: string
  status?: string
  reference_number?: string
  phone_number?: string
  merchant_reference?: string
  timestamp?: string
  error_message?: string
  [key: string]: any
}

interface SasaPayB2CCallback {
  MerchantCode: string
  DestinationChannel: string
  RecipientName: string
  RecipientAccountNumber: string
  ResultCode: string
  ResultDesc: string
  SourceChannel: string
  SasaPayTransactionCode: string
  CheckoutRequestID: string
  SasaPayTransactionID: string
  ThirdPartyTransactionCode: string
  TransactionAmount: string
  TransactionCharges: string
  MerchantRequestID: string
  MerchantTransactionReference: string
  TransactionDate: string
  MerchantAccountBalance: string
  B2CRequestID?: string
  ConversationID?: string
}

interface SasaPayC2BCallback {
  MerchantRequestID: string
  CustomerMobile: string
  ResultCode: string
  ResultDesc: string
  CheckoutRequestID: string
  BillRefNumber: string
  TransAmount: string
  TransactionDate: string
  TransactionCode?: string
  ThirdPartyTransID?: string
  PaymentRequestID?: string
  SourceChannel?: string
}

interface SasaPayIPN {
  InvoiceNumber: string
  PaymentMethod: string
  TransID: string
  ThirdPartyTransID: string
  FullName: string
  FirstName: string
  MiddleName: string
  LastName: string
  MSISDN: string
  OrgAccountBalance: string
  TransAmount: string
  TransactionType: string
  TransTime: string
  BillRefNumber: string
  MerchantCode: string
  BusinessShortCode: string
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const body = await request.json()
    const supabase = await createServerClient()

    console.log("SasaPay webhook received:", body)

    // Determine webhook type based on payload structure
    const webhookType = determineWebhookType(body)

    // Log webhook for debugging and audit
    const webhookLog = await supabase
      .from("webhook_logs")
      .insert({
        provider_id: "sasapay",
        webhook_type: webhookType,
        payload: body,
        headers: Object.fromEntries(headersList.entries()),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Route to appropriate handler based on webhook type
    switch (webhookType) {
      case 'c2b_callback':
        return await handleC2BCallback(body as SasaPayC2BCallback, supabase)
      
      case 'b2c_callback':
        return await handleB2CCallback(body as SasaPayB2CCallback, supabase)
      
      case 'ipn':
        return await handleIPN(body as SasaPayIPN, supabase)
      
      case 'legacy_callback':
        return await handleLegacyCallback(body as SasaPayCallback, supabase)
      
      default:
        console.warn("Unknown SasaPay webhook type:", webhookType)
        return NextResponse.json({
          status: "success",
          message: "Webhook received but not processed",
          webhook_type: webhookType,
        })
    }

  } catch (error) {
    console.error("SasaPay webhook error:", error)

    // Log the error
    try {
      const supabase = await createServerClient()
      const headersList = await headers()
      await supabase.from("webhook_logs").insert({
        provider_id: "sasapay",
        webhook_type: "error",
        payload: { error: error instanceof Error ? error.message : "Unknown error" },
        headers: Object.fromEntries(headersList.entries()),
        error_message: error instanceof Error ? error.message : "Unknown error",
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error("Failed to log SasaPay webhook error:", logError)
    }

    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Handle B2C payment callback
 */
async function handleB2CCallback(callback: SasaPayB2CCallback, supabase: SupabaseClient) {
  try {
    console.log("Processing B2C callback:", callback)

    // Create P2P manager instance with request-scoped supabase client
    const p2pOrderManager = new P2POrderManager(supabase)
    
    // Process the B2C payment confirmation
    await p2pOrderManager.processB2CPaymentConfirmation(callback)

    return NextResponse.json({
      status: "success",
      message: "B2C payment callback processed successfully",
      transaction_id: callback.SasaPayTransactionID || callback.CheckoutRequestID,
    })
  } catch (error) {
    console.error("Error processing B2C callback:", error)
    return NextResponse.json(
      {
        status: "error", 
        message: "Failed to process B2C callback",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Determine webhook type based on payload structure
 */
function determineWebhookType(body: any): string {
  if (body.CheckoutRequestID && body.MerchantRequestID && body.ResultCode !== undefined) {
    return 'c2b_callback'
  }
  if (body.B2CRequestID || (body.MerchantCode && body.DestinationChannel && body.RecipientAccountNumber)) {
    return 'b2c_callback'
  }
  if (body.InvoiceNumber && body.TransactionType) {
    return 'ipn'
  }
  if (body.transaction_id || body.status) {
    return 'legacy_callback'
  }
  return 'unknown'
}

/**
 * Handle C2B Payment Callback Results
 */
async function handleC2BCallback(data: SasaPayC2BCallback, supabase: any) {
  try {
    console.log("Processing SasaPay C2B callback:", {
      checkout_request_id: data.CheckoutRequestID,
      result_code: data.ResultCode,
      result_desc: data.ResultDesc,
    })

    // Create P2P manager instance with request-scoped supabase client
    const p2pOrderManager = new P2POrderManager(supabase)
    
    // Use P2P Order Manager to process the payment confirmation
    const success = await p2pOrderManager.processPaymentConfirmation(data)

    return NextResponse.json({
      status: success ? "success" : "error",
      message: success ? "Payment processed successfully" : "Payment processing failed",
      checkout_request_id: data.CheckoutRequestID,
    })

  } catch (error) {
    console.error("C2B callback processing error:", error)
    return NextResponse.json({
      status: "error",
      message: "Failed to process C2B callback",
    }, { status: 500 })
  }
}

/**
 * Handle Instant Payment Notification (IPN)
 */
async function handleIPN(data: SasaPayIPN, supabase: any) {
  try {
    console.log("Processing SasaPay IPN:", {
      invoice_number: data.InvoiceNumber,
      trans_id: data.TransID,
      amount: data.TransAmount,
      transaction_type: data.TransactionType,
    })

    // Find transaction by bill reference number or transaction ID
    const { data: transaction, error: findError } = await supabase
      .from("payment_transactions")
      .select(`
        *,
        orders(*)
      `)
      .or(`reference_number.eq.${data.BillRefNumber},external_transaction_id.eq.${data.TransID}`)
      .single()

    if (findError || !transaction) {
      console.log("No matching transaction found for IPN, creating record:", {
        invoice_number: data.InvoiceNumber,
        bill_ref_number: data.BillRefNumber,
        trans_id: data.TransID,
      })

      // Create unmatched IPN record
      await supabase
        .from("payment_transactions")
        .insert({
          external_transaction_id: data.TransID,
          transaction_type: "sasapay_ipn",
          amount: Number.parseFloat(data.TransAmount),
          currency: "KES", // Assuming KES for SasaPay
          status: "completed",
          payment_method: "sasapay",
          payer_phone: data.MSISDN,
          payer_name: data.FullName,
          reference_number: data.BillRefNumber,
          description: `SasaPay IPN - ${data.TransactionType}`,
          metadata: {
            provider: "sasapay",
            invoice_number: data.InvoiceNumber,
            payment_method: data.PaymentMethod,
            transaction_type: data.TransactionType,
            trans_time: data.TransTime,
            merchant_code: data.MerchantCode,
            org_account_balance: data.OrgAccountBalance,
            third_party_trans_id: data.ThirdPartyTransID,
          },
          webhook_data: data,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })

      return NextResponse.json({
        status: "success",
        message: "IPN recorded as unmatched transaction",
      })
    }

    // Update existing transaction with IPN data
    await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        payer_name: data.FullName,
        metadata: {
          ...transaction.metadata,
          ipn_data: data,
          invoice_number: data.InvoiceNumber,
          trans_time: data.TransTime,
          org_account_balance: data.OrgAccountBalance,
          payment_method: data.PaymentMethod,
        },
        webhook_data: { ...transaction.webhook_data, ipn: data },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    console.log("IPN processed successfully for transaction:", transaction.id)

    return NextResponse.json({
      status: "success",
      message: "IPN processed successfully",
    })

  } catch (error) {
    console.error("IPN processing error:", error)
    return NextResponse.json({
      status: "error",
      message: "Failed to process IPN",
    }, { status: 500 })
  }
}

/**
 * Handle legacy callback format (backward compatibility)
 */
async function handleLegacyCallback(data: SasaPayCallback, supabase: any) {
  const {
    transaction_id,
    amount,
    currency = "KES",
    status,
    reference_number,
    phone_number,
    merchant_reference,
    timestamp,
    error_message
  } = data

  // Find transaction by external ID or merchant reference
  const { data: transaction, error: findError } = await supabase
    .from("payment_transactions")
    .select(`
      *,
      orders(*)
    `)
    .or(`external_transaction_id.eq.${transaction_id},reference_number.eq.${merchant_reference}`)
    .single()

  if (findError || !transaction) {
    console.log("Transaction not found, creating unmatched record:", {
      transaction_id,
      merchant_reference
    })

    // Create unmatched transaction record
    const { data: newTransaction, error: createError } = await supabase
      .from("payment_transactions")
      .insert({
        external_transaction_id: transaction_id,
        transaction_type: "sasapay_legacy",
        amount: Number(amount || 0),
        currency,
        status: status?.toLowerCase() === "success" ? "completed" : "failed",
        payment_method: "sasapay",
        payer_phone: phone_number,
        reference_number: reference_number || merchant_reference,
        description: `SasaPay legacy payment - ${status || "unknown"}`,
        metadata: {
          provider: "sasapay",
          timestamp,
          merchant_reference,
          original_status: status,
        },
        webhook_data: data,
        initiated_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        completed_at: status?.toLowerCase() === "success" ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error("Failed to create unmatched SasaPay transaction:", createError)
      return NextResponse.json({ status: "error", message: "Failed to create transaction" })
    }

    return NextResponse.json({ status: "success", message: "Unmatched transaction recorded" })
  }

  // Update existing transaction
  let newStatus = "failed"
  let completedAt = null

  if (status?.toLowerCase() === "success" || status?.toLowerCase() === "completed") {
    newStatus = "completed"
    completedAt = new Date().toISOString()
  } else if (status?.toLowerCase() === "pending") {
    newStatus = "pending"
  }

  const updatedMetadata = {
    ...transaction.metadata,
    sasapay_status: status,
    timestamp,
    reference_number,
    phone_number,
    error_message: error_message || null,
  }

  // Update transaction
  const { error: updateError } = await supabase
    .from("payment_transactions")
    .update({
      status: newStatus,
      completed_at: completedAt,
      reference_number: reference_number || transaction.reference_number,
      webhook_data: data,
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction.id)

  if (updateError) {
    console.error("Failed to update SasaPay transaction:", updateError)
    return NextResponse.json({ status: "error", message: "Failed to update transaction" })
  }

  // Update order status if payment is successful
  if (newStatus === "completed" && transaction.orders) {
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
      console.log("SasaPay payment confirmed for order:", transaction.order_id)
      
      // Trigger order completion workflow
      await triggerOrderCompletionWorkflow(transaction, supabase)
    }
  }

  console.log("SasaPay webhook processed successfully:", {
    transactionId: transaction.id,
    status: newStatus,
    amount,
    referenceNumber: reference_number,
  })

  return NextResponse.json({ status: "success", message: "Webhook processed" })
}

// Trigger order completion workflow
async function triggerOrderCompletionWorkflow(transaction: any, supabase: any) {
  try {
    const order = transaction.orders

    // 1. Notify seller that payment is confirmed
    await notifySeller(order, transaction, supabase)

    // 2. Send notifications to relevant parties
    await sendNotifications(order, transaction, supabase)

    console.log("SasaPay order completion workflow triggered successfully for order:", order.id)
  } catch (error) {
    console.error("SasaPay order completion workflow failed:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Log the workflow failure
    await supabase.from("webhook_logs").insert({
      provider_id: "sasapay",
      webhook_type: "workflow_error",
      payload: { orderId: transaction.order_id, error: errorMessage },
      error_message: `Workflow failed: ${errorMessage}`,
      created_at: new Date().toISOString(),
    })
  }
}

// Notify seller function
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
    title: "SasaPay Payment Confirmed",
    message: `Payment of ${transaction.amount} ${transaction.currency} has been confirmed for order ${order.id}`,
    data: {
      order_id: order.id,
      transaction_id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      reference_number: transaction.reference_number,
      provider: "sasapay",
    },
    created_at: new Date().toISOString(),
  })

  console.log("SasaPay seller notification created for:", seller.id)
}

// Send notifications function
async function sendNotifications(order: any, transaction: any, supabase: any) {
  // Implementation for sending email/SMS notifications
  // This can be expanded based on your notification requirements
  console.log("SasaPay notifications sent for order:", order.id)
}

// Handle GET requests for health checks
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "sasapay-webhook",
    timestamp: new Date().toISOString(),
  })
}
