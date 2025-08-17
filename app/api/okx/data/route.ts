import { type NextRequest, NextResponse } from "next/server"
import { OKXExchange } from "@/lib/exchanges/okx-exchange"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { action, apiKey, apiSecret, passphrase, currency } = await request.json()

    if (!apiKey || !apiSecret || !passphrase) {
      return NextResponse.json({ error: "Missing required API credentials" }, { status: 400 })
    }

    // Create OKX exchange instance with provided credentials
    const okxExchange = new OKXExchange(apiKey, apiSecret, passphrase)

    if (!okxExchange.isConnected) {
      return NextResponse.json({ error: "Failed to initialize OKX connection" }, { status: 400 })
    }

    switch (action) {
      case "verify-connection":
        try {
          const userInfo = await okxExchange.getUserInfo()
          return NextResponse.json({ 
            success: true, 
            connected: true,
            userInfo 
          })
        } catch (error) {
          return NextResponse.json({ 
            success: false, 
            connected: false,
            error: "Failed to verify connection with OKX" 
          }, { status: 401 })
        }

      case "user-info":
        try {
          const userInfo = await okxExchange.getUserInfo()
          return NextResponse.json(userInfo)
        } catch (error) {
          console.error("Failed to get user info:", error)
          return NextResponse.json({ error: "Failed to get user information" }, { status: 500 })
        }

      case "balance":
        try {
          const targetCurrency = currency || "USDT"
          const balance = await okxExchange.getBalance(targetCurrency)
          return NextResponse.json(balance)
        } catch (error) {
          console.error("Failed to get balance:", error)
          return NextResponse.json({ error: "Failed to get balance" }, { status: 500 })
        }

      case "balances":
        try {
          // Get balances for major currencies
          const currencies = ["USDT", "BTC", "ETH"]
          const balances: Record<string, any> = {}
          
          for (const curr of currencies) {
            try {
              balances[curr] = await okxExchange.getBalance(curr)
            } catch (error) {
              console.error(`Failed to get ${curr} balance:`, error)
              balances[curr] = { available: "0", frozen: "0" }
            }
          }
          
          return NextResponse.json(balances)
        } catch (error) {
          console.error("Failed to get balances:", error)
          return NextResponse.json({ error: "Failed to get balances" }, { status: 500 })
        }

      case "payment-methods":
        try {
          const paymentMethods = await okxExchange.getPaymentMethods()
          return NextResponse.json(paymentMethods)
        } catch (error) {
          console.error("Failed to get payment methods:", error)
          return NextResponse.json({ error: "Failed to get payment methods" }, { status: 500 })
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("OKX Data API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    // For GET requests, we need to get credentials from the database
    const supabase = createServerClient()
    
    // Get the authenticated user
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
      return NextResponse.json({ error: "OKX credentials not found" }, { status: 404 })
    }

    // Create OKX exchange instance
    const okxExchange = new OKXExchange(
      credentials.api_key,
      credentials.api_secret,
      credentials.passphrase
    )

    if (!okxExchange.isConnected) {
      return NextResponse.json({ error: "Failed to initialize OKX connection" }, { status: 400 })
    }

    switch (action) {
      case "user-info":
        try {
          const userInfo = await okxExchange.getUserInfo()
          return NextResponse.json(userInfo)
        } catch (error) {
          console.error("Failed to get user info:", error)
          return NextResponse.json({ error: "Failed to get user information" }, { status: 500 })
        }

      case "balance":
        try {
          const currency = searchParams.get("currency") || "USDT"
          const balance = await okxExchange.getBalance(currency)
          return NextResponse.json(balance)
        } catch (error) {
          console.error("Failed to get balance:", error)
          return NextResponse.json({ error: "Failed to get balance" }, { status: 500 })
        }

      case "balances":
        try {
          // Get balances for major currencies
          const currencies = ["USDT", "BTC", "ETH"]
          const balances: Record<string, any> = {}
          
          for (const curr of currencies) {
            try {
              balances[curr] = await okxExchange.getBalance(curr)
            } catch (error) {
              console.error(`Failed to get ${curr} balance:`, error)
              balances[curr] = { available: "0", frozen: "0" }
            }
          }
          
          return NextResponse.json(balances)
        } catch (error) {
          console.error("Failed to get balances:", error)
          return NextResponse.json({ error: "Failed to get balances" }, { status: 500 })
        }

      case "payment-methods":
        try {
          const paymentMethods = await okxExchange.getPaymentMethods()
          return NextResponse.json(paymentMethods)
        } catch (error) {
          console.error("Failed to get payment methods:", error)
          return NextResponse.json({ error: "Failed to get payment methods" }, { status: 500 })
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("OKX Data GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
