import { isPostgresAdapter } from "@/lib/composition/backend-adapter"
import { PaymentService } from "@/lib/payments/payment-service"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "Payment status route is not migrated to Postgres yet." }, { status: 501 })
  }

  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
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
