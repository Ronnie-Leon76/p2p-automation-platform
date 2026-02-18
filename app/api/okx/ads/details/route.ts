import { decrypt } from "@/lib/crypto/encryption"
import { OKXExchange } from "@/lib/exchanges/okx-exchange"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adId = searchParams.get("adId")
    
    if (!adId) {
      return NextResponse.json({ error: "adId is required" }, { status: 400 })
    }

    // Get the authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user's OKX credentials
    const { data: credentials, error: credError } = await supabase
      .from('exchange_credentials')
      .select('api_key, api_secret, passphrase')
      .eq('user_id', user.id)
      .eq('exchange', 'okx')
      .eq('is_active', true)
      .single()

    if (credError || !credentials) {
      return NextResponse.json({ 
        error: "OKX credentials not found. Please set up your OKX API credentials.",
        action: "setup_required"
      }, { status: 404 })
    }

    // Decrypt the credentials
    const decryptedApiKey = decrypt(credentials.api_key);
    const decryptedApiSecret = decrypt(credentials.api_secret);
    const decryptedPassphrase = decrypt(credentials.passphrase);

    // Create OKX exchange instance
    const okxExchange = new OKXExchange(
      decryptedApiKey,
      decryptedApiSecret,
      decryptedPassphrase
    )

    if (!okxExchange.isConnected) {
      return NextResponse.json({ error: "Failed to initialize OKX connection" }, { status: 400 })
    }

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
