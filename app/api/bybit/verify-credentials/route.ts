import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret } = await request.json()

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "Missing required API credentials" }, { status: 400 })
    }

    // Create Bybit API signature
    const timestamp = Date.now()
    const params = `api_key=${apiKey}&timestamp=${timestamp}`
    const signature = crypto.createHmac("sha256", apiSecret).update(params).digest("hex")

    // Test API credentials by calling Bybit account endpoint
    const response = await fetch(`https://api.bybit.com/v2/private/wallet/balance?${params}&sign=${signature}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: "Invalid API credentials",
          details: errorData.ret_msg || "Authentication failed",
        },
        { status: 401 },
      )
    }

    const accountData = await response.json()

    // Check if account has P2P permissions by testing OTC endpoint
    const otcParams = `api_key=${apiKey}&timestamp=${Date.now()}`
    const otcSignature = crypto.createHmac("sha256", apiSecret).update(otcParams).digest("hex")

    const otcResponse = await fetch(`https://api.bybit.com/spot/v1/otc/item/list?${otcParams}&sign=${otcSignature}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const hasP2PPermissions = otcResponse.ok

    return NextResponse.json({
      valid: true,
      hasP2PPermissions,
      accountInfo: {
        retCode: accountData.ret_code,
        retMsg: accountData.ret_msg,
        result: accountData.result,
      },
    })
  } catch (error) {
    console.error("Bybit API verification error:", error)
    return NextResponse.json({ error: "Failed to verify API credentials" }, { status: 500 })
  }
}