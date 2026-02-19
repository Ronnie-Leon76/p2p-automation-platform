import { getOkxExchangeForAuthenticatedUser } from "@/lib/exchanges/okx-server-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { adId, status } = await request.json()
    
    if (!adId || !status) {
      return NextResponse.json({ error: "adId and status are required" }, { status: 400 })
    }

    if (!["hidden", "show"].includes(status)) {
      return NextResponse.json({ error: "status must be 'hidden' or 'show'" }, { status: 400 })
    }

    const authResult = await getOkxExchangeForAuthenticatedUser()
    if (!authResult.ok) {
      return NextResponse.json(authResult.body, { status: authResult.status })
    }
    const okxExchange = authResult.okxExchange

    // Update ad status
    const result = await okxExchange.updateAdStatus(adId, status as "hidden" | "show")

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          adId: result.adId,
          message: `Ad ${status === "hidden" ? "hidden" : "activated"} successfully`
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to update ad status"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Toggle ad status API error:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
