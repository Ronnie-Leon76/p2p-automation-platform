import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { PaymentService } from "@/lib/payments/payment-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { team_id, provider_id, order_id, amount, currency, payer_phone, payer_name, description } = body

    // Verify user has access to team
    const { data: teamMember, error: teamError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", team_id)
      .eq("user_id", session.user.id)
      .single()

    if (teamError || !teamMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const paymentService = new PaymentService()
    const transaction = await paymentService.initiatePayment(team_id, provider_id, {
      order_id,
      amount,
      currency,
      payer_phone,
      payer_name,
      description,
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Payment initiation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate payment" },
      { status: 500 },
    )
  }
}
