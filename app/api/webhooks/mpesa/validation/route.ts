import { type NextRequest, NextResponse } from "next/server"
import { MPesaWebhookHandler } from "@/lib/payments/mpesa-webhook-handler"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const handler = new MPesaWebhookHandler()

    console.log("M-Pesa validation request:", body)

    const validation = await handler.validateC2BPayment(body)

    if (validation.isValid) {
      return NextResponse.json({
        ResultCode: "0",
        ResultDesc: "Accepted",
      })
    } else {
      return NextResponse.json({
        ResultCode: "C2B00011",
        ResultDesc: validation.reason || "Validation failed",
      })
    }
  } catch (error) {
    console.error("M-Pesa validation error:", error)
    return NextResponse.json({
      ResultCode: "C2B00016",
      ResultDesc: "Validation failed",
    })
  }
}