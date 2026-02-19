import { getOkxExchangeForAuthenticatedUser } from "@/lib/exchanges/okx-server-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { adId } = await request.json()
    
    if (!adId) {
      return NextResponse.json({ error: "adId is required" }, { status: 400 })
    }

    const authResult = await getOkxExchangeForAuthenticatedUser()
    if (!authResult.ok) {
      return NextResponse.json(authResult.body, { status: authResult.status })
    }
    const okxExchange = authResult.okxExchange

    // Cancel the ad
    const result = await okxExchange.cancelAd(adId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          adId: result.adId,
          message: "Ad cancelled successfully"
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to cancel ad"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Cancel ad API error:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
