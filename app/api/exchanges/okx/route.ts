import { type NextRequest, NextResponse } from "next/server"
import { exchangeManager } from "@/lib/exchanges/exchange-manager"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    const okxExchange = exchangeManager.getExchange("okx")
    if (!okxExchange) {
      return NextResponse.json({ error: "OKX exchange not configured" }, { status: 400 })
    }

    switch (action) {
      case "user-info":
        const userInfo = await okxExchange.getUserInfo()
        return NextResponse.json(userInfo)

      case "balance":
        const currency = searchParams.get("currency") || "USDT"
        const balance = await okxExchange.getBalance(currency)
        return NextResponse.json(balance)

      case "active-ads":
        const side = searchParams.get("side") || "sell"
        const cryptoCurrency = searchParams.get("cryptoCurrency") || "USDT"
        const fiatCurrency = searchParams.get("fiatCurrency") || "CNY"
        const activeAds = await okxExchange.getActiveAds({
          side: side as "buy" | "sell",
          cryptoCurrency,
          fiatCurrency,
        })
        return NextResponse.json(activeAds)

      case "marketplace-ads":
        const marketplaceAds = await okxExchange.getMarketplaceAds({
          cryptoCurrency: searchParams.get("cryptoCurrency") || "USDT",
          fiatCurrency: searchParams.get("fiatCurrency") || "CNY",
          side: (searchParams.get("side") as "buy" | "sell" | "all") || "all",
        })
        return NextResponse.json(marketplaceAds)

      case "optimal-price":
        const optimalPrice = await okxExchange.getOptimalPrice(
          searchParams.get("cryptoCurrency") || "USDT",
          searchParams.get("fiatCurrency") || "CNY",
        )
        return NextResponse.json(optimalPrice)

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("OKX API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const body = await request.json()

    const okxExchange = exchangeManager.getExchange("okx")
    if (!okxExchange) {
      return NextResponse.json({ error: "OKX exchange not configured" }, { status: 400 })
    }

    switch (action) {
      case "create-ad":
        const createResult = await okxExchange.createAd(body)
        return NextResponse.json(createResult)

      case "update-ad":
        const { adId, ...updateParams } = body
        const updateResult = await okxExchange.updateAd(adId, updateParams)
        return NextResponse.json(updateResult)

      case "cancel-ad":
        const cancelResult = await okxExchange.cancelAd(body.adId)
        return NextResponse.json(cancelResult)

      case "create-order":
        const orderResult = await okxExchange.createOrder(body)
        return NextResponse.json(orderResult)

      case "mark-paid":
        const markPaidResult = await okxExchange.markOrderAsPaid(body.orderId, body.params)
        return NextResponse.json(markPaidResult)

      case "release-crypto":
        const releaseResult = await okxExchange.releaseCrypto(body.orderId, body.params)
        return NextResponse.json(releaseResult)

      case "cancel-order":
        const cancelOrderResult = await okxExchange.cancelOrder(body.orderId)
        return NextResponse.json(cancelOrderResult)

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("OKX API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
