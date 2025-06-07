import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret, passphrase } = await request.json()

    if (!apiKey || !apiSecret || !passphrase) {
      return NextResponse.json({ error: "Missing required API credentials" }, { status: 400 })
    }

    // Create OKX API signature
    const timestamp = Date.now() / 1000
    const method = "GET"
    const requestPath = "/api/v5/account/config"
    const body = ""

    const prehashString = timestamp + method + requestPath + body
    const signature = crypto.createHmac("sha256", apiSecret).update(prehashString).digest("base64")

    // Test API credentials by calling OKX account config endpoint
    const response = await fetch(`https://www.okx.com${requestPath}`, {
      method: "GET",
      headers: {
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": timestamp.toString(),
        "OK-ACCESS-PASSPHRASE": passphrase,
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

    // Check if account has P2P permissions by testing P2P endpoint
    const p2pTestPath = "/api/v5/finance/otc-config"
    const p2pPrehashString = timestamp + method + p2pTestPath + body
    const p2pSignature = crypto.createHmac("sha256", apiSecret).update(p2pPrehashString).digest("base64")

    const p2pResponse = await fetch(`https://www.okx.com${p2pTestPath}`, {
      method: "GET",
      headers: {
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": p2pSignature,
        "OK-ACCESS-TIMESTAMP": timestamp.toString(),
        "OK-ACCESS-PASSPHRASE": passphrase,
        "Content-Type": "application/json",
      },
    })

    const hasP2PPermissions = p2pResponse.ok

    return NextResponse.json({
      valid: true,
      hasP2PPermissions,
      accountInfo: {
        uid: accountData.data?.[0]?.uid,
        level: accountData.data?.[0]?.level,
        roleType: accountData.data?.[0]?.roleType,
      },
    })
  } catch (error) {
    console.error("OKX API verification error:", error)
    return NextResponse.json({ error: "Failed to verify API credentials" }, { status: 500 })
  }
}