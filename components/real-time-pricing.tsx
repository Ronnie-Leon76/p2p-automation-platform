"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Loader2, DollarSign } from "lucide-react"

interface PriceData {
  exchange: string
  cryptoCurrency: string
  fiatCurrency: string
  currentHighestBuyAdPrice: string
  currentLowestSellAdPrice: string
  spread: number
  lastUpdated: string
}

interface MarketData {
  price: string
  change24h: number
  volume24h: string
  timestamp: string
}

export function RealTimePricing() {
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedCrypto, setSelectedCrypto] = useState("USDT")
  const [selectedFiat, setSelectedFiat] = useState("CNY")
  const [refreshing, setRefreshing] = useState(false)

  const exchanges = ["okx", "binance", "bybit"]
  const cryptoCurrencies = ["USDT", "BTC", "ETH"]
  const fiatCurrencies = ["CNY", "USD", "EUR", "KES"]

  useEffect(() => {
    fetchPriceData()
    const interval = setInterval(fetchPriceData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [selectedCrypto, selectedFiat])

  const fetchPriceData = async () => {
    try {
      setLoading(true)
      const promises = exchanges.map(async (exchange) => {
        try {
          const response = await fetch(
            `/api/exchanges/${exchange}?action=optimal-price&cryptoCurrency=${selectedCrypto}&fiatCurrency=${selectedFiat}`
          )
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${exchange} prices`)
          }

          const data = await response.json()
          const buyPrice = parseFloat(data.currentHighestBuyAdPrice || "0")
          const sellPrice = parseFloat(data.currentLowestSellAdPrice || "0")
          const spread = sellPrice > 0 && buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0

          return {
            exchange,
            cryptoCurrency: selectedCrypto,
            fiatCurrency: selectedFiat,
            currentHighestBuyAdPrice: data.currentHighestBuyAdPrice || "0",
            currentLowestSellAdPrice: data.currentLowestSellAdPrice || "0",
            spread,
            lastUpdated: new Date().toISOString(),
          }
        } catch (error) {
          console.error(`Error fetching ${exchange} prices:`, error)
          return {
            exchange,
            cryptoCurrency: selectedCrypto,
            fiatCurrency: selectedFiat,
            currentHighestBuyAdPrice: "0",
            currentLowestSellAdPrice: "0",
            spread: 0,
            lastUpdated: new Date().toISOString(),
          }
        }
      })

      const results = await Promise.all(promises)
      setPriceData(results)

      // Fetch market data for comparison
      await fetchMarketData()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMarketData = async () => {
    try {
      // Simulate market data - in production, use real market data APIs
      const mockMarketData: Record<string, MarketData> = {
        "USDT-CNY": {
          price: "7.23",
          change24h: 0.12,
          volume24h: "1,234,567",
          timestamp: new Date().toISOString(),
        },
        "BTC-USD": {
          price: "43,250",
          change24h: -2.34,
          volume24h: "987,654",
          timestamp: new Date().toISOString(),
        },
        "ETH-EUR": {
          price: "2,450",
          change24h: 1.87,
          volume24h: "456,789",
          timestamp: new Date().toISOString(),
        },
      }

      setMarketData(mockMarketData)
    } catch (error) {
      console.error("Error fetching market data:", error)
    }
  }

  const refreshPrices = async () => {
    setRefreshing(true)
    await fetchPriceData()
    setRefreshing(false)
  }

  const getBestBuyPrice = () => {
    const validPrices = priceData
      .map(p => parseFloat(p.currentHighestBuyAdPrice))
      .filter(p => p > 0)
    return validPrices.length > 0 ? Math.max(...validPrices) : 0
  }

  const getBestSellPrice = () => {
    const validPrices = priceData
      .map(p => parseFloat(p.currentLowestSellAdPrice))
      .filter(p => p > 0)
    return validPrices.length > 0 ? Math.min(...validPrices) : 0
  }

  const getArbitrageOpportunity = () => {
    const bestBuy = getBestBuyPrice()
    const bestSell = getBestSellPrice()
    
    if (bestBuy > 0 && bestSell > 0 && bestBuy > bestSell) {
      return {
        profit: bestBuy - bestSell,
        percentage: ((bestBuy - bestSell) / bestSell) * 100,
        buyExchange: priceData.find(p => parseFloat(p.currentHighestBuyAdPrice) === bestBuy)?.exchange,
        sellExchange: priceData.find(p => parseFloat(p.currentLowestSellAdPrice) === bestSell)?.exchange,
      }
    }
    return null
  }

  const arbitrageOpportunity = getArbitrageOpportunity()
  const marketKey = `${selectedCrypto}-${selectedFiat}`
  const currentMarketData = marketData[marketKey]

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Real-Time Pricing</h2>
          <p className="text-gray-400">Monitor P2P prices across exchanges and identify arbitrage opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cryptoCurrencies.map((crypto) => (
                <SelectItem key={crypto} value={crypto}>
                  {crypto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedFiat} onValueChange={setSelectedFiat}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fiatCurrencies.map((fiat) => (
                <SelectItem key={fiat} value={fiat}>
                  {fiat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPrices}
            disabled={refreshing}
            className="bg-white/5 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/10 hover:border-yellow-400/50"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Market Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Best Buy Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {getBestBuyPrice() > 0 ? getBestBuyPrice().toFixed(4) : "N/A"}
            </div>
            <p className="text-xs text-gray-400">{selectedFiat} per {selectedCrypto}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Best Sell Price</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {getBestSellPrice() > 0 ? getBestSellPrice().toFixed(4) : "N/A"}
            </div>
            <p className="text-xs text-gray-400">{selectedFiat} per {selectedCrypto}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Market Price</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {currentMarketData?.price || "N/A"}
            </div>
            <p className="text-xs text-gray-400">
              {currentMarketData?.change24h && (
                <span className={currentMarketData.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                  {currentMarketData.change24h >= 0 ? "+" : ""}{currentMarketData.change24h.toFixed(2)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Arbitrage</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {arbitrageOpportunity ? `${arbitrageOpportunity.percentage.toFixed(2)}%` : "0%"}
            </div>
            <p className="text-xs text-gray-400">
              {arbitrageOpportunity ? "Opportunity detected" : "No opportunities"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Arbitrage Alert */}
      {arbitrageOpportunity && (
        <Alert className="bg-green-500/10 border-green-500/20">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-400">
            <strong>Arbitrage Opportunity:</strong> Buy on {arbitrageOpportunity.sellExchange?.toUpperCase()} 
            and sell on {arbitrageOpportunity.buyExchange?.toUpperCase()} for a potential 
            {arbitrageOpportunity.percentage.toFixed(2)}% profit ({arbitrageOpportunity.profit.toFixed(4)} {selectedFiat})
          </AlertDescription>
        </Alert>
      )}

      {/* Exchange Prices */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
          </div>
        ) : (
          priceData.map((data) => (
            <Card key={data.exchange} className="bg-white/5 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span>{data.exchange.toUpperCase()}</span>
                  <Badge 
                    variant="outline" 
                    className={`${
                      data.spread > 2 ? "border-red-400/30 text-red-400" : 
                      data.spread > 1 ? "border-yellow-400/30 text-yellow-400" : 
                      "border-green-400/30 text-green-400"
                    }`}
                  >
                    {data.spread.toFixed(2)}% spread
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {data.cryptoCurrency}/{data.fiatCurrency} P2P Prices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Buy Price</p>
                    <p className="text-lg font-semibold text-green-400">
                      {parseFloat(data.currentHighestBuyAdPrice) > 0 
                        ? parseFloat(data.currentHighestBuyAdPrice).toFixed(4)
                        : "No data"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Sell Price</p>
                    <p className="text-lg font-semibold text-red-400">
                      {parseFloat(data.currentLowestSellAdPrice) > 0 
                        ? parseFloat(data.currentLowestSellAdPrice).toFixed(4)
                        : "No data"
                      }
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Price History Chart Placeholder */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white">Price History</CardTitle>
          <CardDescription className="text-gray-400">
            {selectedCrypto}/{selectedFiat} price trends across exchanges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Price history chart coming soon</p>
              <p className="text-sm">Real-time price tracking and historical data visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}