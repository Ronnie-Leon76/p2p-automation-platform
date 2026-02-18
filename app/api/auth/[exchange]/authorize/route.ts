import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const EXCHANGE_CONFIGS = {
  okx: {
    type: "wallet", // OKX uses wallet authentication, not OAuth
    name: "OKX Wallet",
    description: "Connect with OKX Wallet browser extension",
  },
  binance: {
    type: "oauth",
    authUrl: "https://accounts.binance.com/oauth/authorize",
    clientId: process.env.BINANCE_CLIENT_ID,
    scopes: ["user:read", "p2p:read", "p2p:trade"],
  },
  bybit: {
    type: "oauth",
    authUrl: "https://api.bybit.com/oauth/authorize",
    clientId: process.env.BYBIT_CLIENT_ID,
    scopes: ["user.read", "p2p.read", "p2p.trade"],
  },
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ exchange: string }> }) {
  try {
    const resolvedParams = await params
    const { exchange: exchangeName } = resolvedParams
    const exchange = exchangeName.toLowerCase() as keyof typeof EXCHANGE_CONFIGS
    const config = EXCHANGE_CONFIGS[exchange]

    if (!config) {
      return NextResponse.json({ error: "Unsupported exchange" }, { status: 400 })
    }

    // Handle OKX wallet authentication differently
    if (exchange === "okx") {
      // Redirect to OKX wallet connection page
      const walletAuthUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/okx/setup`
      return NextResponse.redirect(walletAuthUrl)
    }

    // Handle traditional OAuth for other exchanges
    if (config.type === "oauth") {
      const oauthConfig = config as { authUrl: string; clientId?: string; scopes: string[] };
      if (!oauthConfig.clientId) {
        return NextResponse.json({ error: `${exchange.toUpperCase()} OAuth not configured` }, { status: 500 })
      }

      // Generate state parameter for security
      const state = crypto.randomUUID()
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/${exchange}/callback`

      // Store state in session for verification
      const supabase = await createServerClient()
      await supabase.from("oauth_states").insert({
        state,
        exchange,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })

      // Build OAuth URL
      const authUrl = new URL(oauthConfig.authUrl)
      authUrl.searchParams.set("client_id", oauthConfig.clientId!)
      authUrl.searchParams.set("redirect_uri", redirectUri)
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("scope", oauthConfig.scopes.join(" "))
      authUrl.searchParams.set("state", state)

      return NextResponse.redirect(authUrl.toString())
    }

    return NextResponse.json({ error: "Invalid exchange configuration" }, { status: 500 })
  } catch (error) {
    console.error("OAuth authorization error:", error)
    return NextResponse.json({ error: "Failed to initiate OAuth flow" }, { status: 500 })
  }
}
