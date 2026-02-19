import { isPostgresAdapter } from "@/lib/composition/backend-adapter"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "I&M webhook route is not migrated to Postgres yet." }, { status: 501 })
  }

  try {
    const body = await request.json()
    const supabase = await createServerClient()

    // Verify webhook signature (implement based on I&M Bank documentation)
    const signature = request.headers.get("x-signature")
    const timestamp = request.headers.get("x-timestamp")

    // Log webhook for debugging
    await supabase.from("webhook_logs").insert({
      provider_id: "im-bank-provider-id",
      webhook_type: "im_bank_callback",
      payload: body,
      headers: Object.fromEntries(request.headers.entries()),
      created_at: new Date().toISOString(),
    })

    const { transaction_id, status, amount, currency, reference_number, error_message } = body

    // Find transaction by external ID
    const { data: transaction, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("external_transaction_id", transaction_id)
      .single()

    if (error || !transaction) {
      console.error("Transaction not found for transaction_id:", transaction_id)
      return NextResponse.json({ status: "error", message: "Transaction not found" })
    }

    let newStatus = "failed"
    let completedAt = null

    if (status === "completed" || status === "success") {
      newStatus = "completed"
      completedAt = new Date().toISOString()

      // Update transaction
      await supabase
        .from("payment_transactions")
        .update({
          status: newStatus,
          completed_at: completedAt,
          reference_number,
          webhook_data: body,
        })
        .eq("id", transaction.id)

      // Update order status
      await supabase
        .from("orders")
        .update({
          payment_status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.order_id)
    } else {
      // Payment failed
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          webhook_data: body,
          metadata: { ...transaction.metadata, error: error_message },
        })
        .eq("id", transaction.id)
    }

    return NextResponse.json({ status: "success", message: "Webhook processed" })
  } catch (error) {
    console.error("I&M Bank webhook error:", error)
    return NextResponse.json({ status: "error", message: "Error processing webhook" })
  }
}
