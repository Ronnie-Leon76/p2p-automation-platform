import { OKXExchange } from "@/lib/exchanges/okx-exchange"
import { getOkxExchangeForAuthenticatedUser } from "@/lib/exchanges/okx-server-auth"
import { type NextRequest, NextResponse } from "next/server"

// Helper function to handle OKX API errors
function handleOKXError(error: unknown, action: string) {
  console.error(`Failed to ${action}:`, error)
  if (error instanceof Error && error.message.includes('401')) {
    return NextResponse.json({ 
      error: "Invalid OKX API credentials. Please update your credentials.",
      action: "credentials_invalid"
    }, { status: 401 })
  }
  return NextResponse.json({ error: `Failed to ${action}` }, { status: 500 })
}

// POST handler for actions that modify data (kept for backwards compatibility)
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

      case "merchant-profile":
        try {
          const merchantProfile = await okxExchange.getMerchantProfile()
          return NextResponse.json(merchantProfile)
        } catch (error) {
          console.error("Failed to get merchant profile:", error)
          return NextResponse.json({ error: "Failed to get merchant profile" }, { status: 500 })
        }

      case "balances":
        try {
          // Get all major currency balances
          const currencies = ['USDT', 'BTC', 'ETH', 'BNB', 'USDC'];
          const balances: Record<string, any> = {};
          
          await Promise.all(currencies.map(async (curr) => {
            try {
              const balance = await okxExchange.getBalance(curr);
              if (balance.availableAmount !== "0" || balance.onHoldAmount !== "0") {
                balances[curr] = balance;
              }
            } catch (error) {
              console.warn(`Failed to get ${curr} balance:`, error);
              // Continue with other currencies
            }
          }));

          return NextResponse.json(balances);
        } catch (error) {
          console.error("Failed to get balances:", error)
          return NextResponse.json({ error: "Failed to get account balances" }, { status: 500 })
        }

      case "payment-methods":
        try {
          const paymentMethods = await okxExchange.getPaymentMethods()
          return NextResponse.json(paymentMethods)
        } catch (error) {
          console.error("Failed to get payment methods:", error)
          return NextResponse.json({ error: "Failed to get payment methods" }, { status: 500 })
        }

      case "orders":
        try {
          // Get recent orders with pagination
          const orders = await okxExchange.getOrders({ 
            pageIndex: "0",
            pageSize: "50" // Get last 50 orders
          })
          return NextResponse.json(orders)
        } catch (error) {
          console.error("Failed to get merchant profile:", error)
          return NextResponse.json({ error: "Failed to get merchant profile" }, { status: 500 })
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
    const authResult = await getOkxExchangeForAuthenticatedUser()
    if (!authResult.ok) {
      return NextResponse.json(authResult.body, { status: authResult.status })
    }
    const okxExchange = authResult.okxExchange

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

      case "merchant-profile":
        try {
          const merchantProfile = await okxExchange.getMerchantProfile()
          return NextResponse.json(merchantProfile)
        } catch (error) {
          console.error("Failed to get merchant profile:", error)
          return NextResponse.json({ error: "Failed to get merchant profile" }, { status: 500 })
        }

      case "orders":
        try {
          // Get recent orders with pagination
          const orders = await okxExchange.getOrders({ 
            pageIndex: "0",
            pageSize: "50" // Get last 50 orders
          })
          return NextResponse.json(orders)
        } catch (error) {
          console.error("Failed to get orders:", error)
          return NextResponse.json({ error: "Failed to get orders" }, { status: 500 })
        }

      case "ads":
        try {
          console.log("🔍 Getting user's own ads...")
          
          // First try to get user's own ads
          const userAds = await okxExchange.getUserAds()
          
          console.log("📦 Raw OKX getUserAds response:", userAds)
          console.log("📊 User ads length:", userAds?.ads?.length || 0)
          
          // If user has their own ads, return them
          if (userAds && userAds.ads && userAds.ads.length > 0) {
            console.log("✅ Returning user's own ads:", userAds.ads.length)
            return NextResponse.json(userAds)
          }
          
          // Fallback: get marketplace ads for reference/demo
          console.log("📋 No user ads found, falling back to marketplace ads for demo...")
          const sideParam = searchParams.get("side") || "sell"
          const side = (sideParam === "buy" || sideParam === "sell") ? sideParam : "sell"
          const cryptoCurrency = searchParams.get("cryptoCurrency") || "USDT"
          const fiatCurrency = searchParams.get("fiatCurrency") || "KES"
          
          console.log("🔍 Getting marketplace ads with params:", { side, cryptoCurrency, fiatCurrency })
          
          const marketplaceAds = await okxExchange.getActiveAds({
            side,
            cryptoCurrency,
            fiatCurrency
          })
          
          console.log("📦 Raw OKX getActiveAds response:", marketplaceAds)
          console.log("📊 Marketplace ads length:", marketplaceAds?.ads?.length || 0)
          
          return NextResponse.json(marketplaceAds)
        } catch (error) {
          console.error("Failed to get ads:", error)
          return NextResponse.json({ error: "Failed to get ads" }, { status: 500 })
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("OKX Data GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
