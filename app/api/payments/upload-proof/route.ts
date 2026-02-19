import { isPostgresAdapter } from "@/lib/composition/backend-adapter"
import { PaymentService } from "@/lib/payments/payment-service"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "Payment proof upload route is not migrated to Postgres yet." }, { status: 501 })
  }

  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const transactionId = formData.get("transaction_id") as string
    const orderId = formData.get("order_id") as string

    if (!file || !transactionId || !orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const paymentService = new PaymentService()
    const fileUrl = await paymentService.uploadPaymentProof(transactionId, orderId, file, user.id)

    return NextResponse.json({ file_url: fileUrl })
  } catch (error) {
    console.error("Payment proof upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload payment proof" },
      { status: 500 },
    )
  }
}
