import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret } = await request.json()

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "Missing required API credentials" }, { status: 400 })
    }

    // Create Binance API signature
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex")

    // Test API credentials by calling Binance account endpoint
    const response = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: "Invalid API credentials",
          details: errorData.msg || "Authentication failed",
        },
        { status: 401 },
      )
    }

    const accountData = await response.json()

    // Check if account has P2P permissions by testing C2C endpoint
    const c2cQueryString = `timestamp=${Date.now()}`
    const c2cSignature = crypto.createHmac("sha256", apiSecret).update(c2cQueryString).digest("hex")

    const c2cResponse = await fetch(
      `https://api.binance.com/sapi/v1/c2c/orderBook/ticker?${c2cQueryString}&signature=${c2cSignature}`,
      {
        method: "GET",
        headers: {
          "X-MBX-APIKEY": apiKey,
          "Content-Type": "application/json",
        },
      },
    )

    const hasP2PPermissions = c2cResponse.ok

    return NextResponse.json({
      valid: true,
      hasP2PPermissions,
      accountInfo: {
        accountType: accountData.accountType,
        canTrade: accountData.canTrade,
        canWithdraw: accountData.canWithdraw,
        canDeposit: accountData.canDeposit,
      },
    })
  } catch (error) {
    console.error("Binance API verification error:", error)
    return NextResponse.json({ error: "Failed to verify API credentials" }, { status: 500 })
  }
}