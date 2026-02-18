import { decrypt } from "@/lib/crypto/encryption"
import { OKXExchange } from "@/lib/exchanges/okx-exchange"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    
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

    // Validate required fields
    const { 
      side, 
      cryptoCurrency, 
      fiatCurrency, 
      cryptoAmount, 
      minOrderLimit, 
      maxOrderLimit,
      type,
      paymentMethods 
    } = formData

    if (!side || !cryptoCurrency || !fiatCurrency || !cryptoAmount || !minOrderLimit || !maxOrderLimit) {
      return NextResponse.json({ 
        error: "Missing required fields: side, cryptoCurrency, fiatCurrency, cryptoAmount, minOrderLimit, maxOrderLimit" 
      }, { status: 400 })
    }

    // Validate price information based on type
    if (type === "limit" && !formData.unitPrice) {
      return NextResponse.json({ 
        error: "unitPrice is required for limit type ads" 
      }, { status: 400 })
    }

    if (type === "floating_market" && !formData.priceMargin) {
      return NextResponse.json({ 
        error: "priceMargin is required for floating_market type ads" 
      }, { status: 400 })
    }

    // Prepare create ad parameters with all possible fields
    const createAdParams = {
      side: side as "buy" | "sell",
      cryptoCurrency,
      fiatCurrency,
      cryptoAmount,
      minOrderLimit,
      maxOrderLimit,
      unitPrice: formData.unitPrice,
      priceMargin: formData.priceMargin,
      type: type as "limit" | "floating_market",
      paymentMethods: paymentMethods || [],
      paymentMethodIds: formData.paymentMethodIds || [],
      targetGroup: formData.targetGroup || "all",
      minKycLevel: formData.minKycLevel,
      minCompletedOrders: formData.minCompletedOrders,
      minCompletionRate: formData.minCompletionRate,
      remark: formData.remark || "",
      automatedMessage: formData.automatedMessage || ""
    }

    console.log("API Route: Creating ad with params:", createAdParams)

    // Create the ad
    const result = await okxExchange.createAd(createAdParams)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          adId: result.adId,
          message: "Ad created successfully"
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to create ad"
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Create ad API error:", error)
    
    // Handle specific OKX error types
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    
    if (errorMessage.includes("OKX_PERMISSION_ERROR")) {
      return NextResponse.json({ 
        success: false,
        error: "Account Permission Error",
        details: errorMessage.replace("OKX_PERMISSION_ERROR: ", ""),
        code: "PERMISSION_DENIED"
      }, { status: 403 })
    }
    
    if (errorMessage.includes("OKX_PARAMETER_ERROR")) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid Parameters",
        details: errorMessage.replace("OKX_PARAMETER_ERROR: ", ""),
        code: "INVALID_PARAMETERS"
      }, { status: 400 })
    }
    
    if (errorMessage.includes("OKX_SYSTEM_ERROR")) {
      return NextResponse.json({ 
        success: false,
        error: "OKX System Unavailable",
        details: errorMessage.replace("OKX_SYSTEM_ERROR: ", ""),
        code: "SYSTEM_UNAVAILABLE"
      }, { status: 503 })
    }
    
    if (errorMessage.includes("OKX_API_ERROR_")) {
      const codeMatch = errorMessage.match(/OKX_API_ERROR_(\d+)/)
      const code = codeMatch ? codeMatch[1] : "UNKNOWN"
      return NextResponse.json({ 
        success: false,
        error: `OKX API Error ${code}`,
        details: errorMessage.replace(`OKX_API_ERROR_${code}: `, ""),
        code: `OKX_ERROR_${code}`
      }, { status: 400 })
    }
    
    // Generic error handling
    return NextResponse.json({ 
      success: false,
      error: "Failed to create ad",
      details: errorMessage,
      code: "UNKNOWN_ERROR"
    }, { status: 500 })
  }
}
