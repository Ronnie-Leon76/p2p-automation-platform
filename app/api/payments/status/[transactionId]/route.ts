import { getAuthenticatedUser } from "@/lib/auth/server-user"
import { getPaymentStatusUseCase } from "@/lib/domain/payments/payment-status-use-cases"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { transactionId } = await params
    const status = await getPaymentStatusUseCase(transactionId)

    if (!status) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check payment status" },
      { status: 500 },
    )
  }
}
