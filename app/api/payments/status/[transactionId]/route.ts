import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { PaymentService } from "@/lib/payments/payment-service"

export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const supabase = createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const paymentService = new PaymentService()
    const status = await paymentService.checkPaymentStatus(params.transactionId)

    return NextResponse.json(status)
  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check payment status" },
      { status: 500 },
    )
  }
}
