import { type NextRequest, NextResponse } from "next/server"
import { MPesaWebhookHandler } from "@/lib/payments/mpesa-webhook-handler"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const handler = new MPesaWebhookHandler()

    console.log("M-Pesa confirmation request:", body)

    const result = await handler.processC2BConfirmation(body)

    return NextResponse.json({
      ResultCode: "0",
      ResultDesc: "Success",
    })
  } catch (error) {
    console.error("M-Pesa confirmation error:", error)
    return NextResponse.json({
      ResultCode: "1",
      ResultDesc: "Failed to process confirmation",
    })
  }
}