import { getOkxExchangeForAuthenticatedUser } from "@/lib/exchanges/okx-server-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adId = searchParams.get("adId")
    
    if (!adId) {
      return NextResponse.json({ error: "adId is required" }, { status: 400 })
    }

    const authResult = await getOkxExchangeForAuthenticatedUser()
    if (!authResult.ok) {
      return NextResponse.json(authResult.body, { status: authResult.status })
    }
    const okxExchange = authResult.okxExchange

    // Get ad details
    const result = await okxExchange.getAd(adId)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error("Get ad details API error:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
