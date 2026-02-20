import { isPostgresAdapter } from "@/lib/composition/backend-adapter"
import { sasaPayService } from "@/lib/payments/sasapay-service"
import { createServerClient } from "@/lib/database/server-client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "SasaPay route is not migrated to Postgres yet." }, { status: 501 })
  }

  try {
    const body = await request.json()
    const supabase = await createServerClient()

    const {
      amount,
      phone_number,
      description = "P2P Platform Payment",
      order_id,
      user_id,
    } = body

    // Validate required fields
    if (!amount || !phone_number || !order_id) {
      return NextResponse.json(
        { error: "Missing required fields: amount, phone_number, order_id" },
        { status: 400 }
      )
    }

    // Generate unique merchant reference
    const merchantReference = `P2P_${order_id}_${Date.now()}`

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id,
        user_id,
        transaction_type: "sasapay_payment",
        amount: Number(amount),
        currency: "KES",
        status: "pending",
        payment_method: "sasapay",
        payer_phone: phone_number,
        reference_number: merchantReference,
        description,
        metadata: {
          provider: "sasapay",
          merchant_reference: merchantReference,
        },
        initiated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Failed to create transaction record:", transactionError)
      return NextResponse.json(
        { error: "Failed to create transaction record" },
        { status: 500 }
      )
    }

    // Initiate SasaPay payment
    try {
      const paymentResponse = await sasaPayService.initiatePayment({
        amount: Number(amount),
        currency: "KES",
        phone_number,
        merchant_reference: merchantReference,
        description,
      })

      // Update transaction with external ID
      await supabase
        .from("payment_transactions")
        .update({
          external_transaction_id: paymentResponse.transaction_id,
          metadata: {
            ...transaction.metadata,
            sasapay_response: paymentResponse,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      console.log("SasaPay payment initiated successfully:", {
        transactionId: transaction.id,
        externalId: paymentResponse.transaction_id,
        merchantReference,
      })

      return NextResponse.json({
        success: true,
        transaction_id: transaction.id,
        external_transaction_id: paymentResponse.transaction_id,
        merchant_reference: merchantReference,
        status: paymentResponse.status,
        message: paymentResponse.message,
      })

    } catch (sasaPayError) {
      console.error("SasaPay payment initiation failed:", sasaPayError)

      // Update transaction status to failed
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          metadata: {
            ...transaction.metadata,
            error: sasaPayError instanceof Error ? sasaPayError.message : "Unknown error",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      return NextResponse.json(
        {
          error: "Payment initiation failed",
          message: sasaPayError instanceof Error ? sasaPayError.message : "Unknown error",
          transaction_id: transaction.id,
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("SasaPay payment API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "SasaPay route is not migrated to Postgres yet." }, { status: 501 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transaction_id')
    const externalId = searchParams.get('external_id')

    if (!transactionId && !externalId) {
      return NextResponse.json(
        { error: "Missing transaction_id or external_id parameter" },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get transaction from database
    let query = supabase
      .from("payment_transactions")
      .select("*")

    if (transactionId) {
      query = query.eq("id", transactionId)
    } else {
      query = query.eq("external_transaction_id", externalId)
    }

    const { data: transaction, error } = await query.single()

    if (error || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // If transaction has external ID, query SasaPay for latest status
    if (transaction.external_transaction_id) {
      try {
        const sasaPayStatus = await sasaPayService.getPaymentStatus(transaction.external_transaction_id)
        
        return NextResponse.json({
          transaction,
          sasapay_status: sasaPayStatus,
        })
      } catch (sasaPayError) {
        console.error("Failed to query SasaPay status:", sasaPayError)
        return NextResponse.json({
          transaction,
          sasapay_status: null,
          error: "Failed to query external status",
        })
      }
    }

    return NextResponse.json({ transaction })

  } catch (error) {
    console.error("SasaPay status API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

