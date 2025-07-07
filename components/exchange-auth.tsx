"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bot, AlertCircle, Loader2, ExternalLink, Shield, TrendingUp, Users } from "lucide-react"
import { ExchangeOAuthService } from "@/lib/auth/exchange-oauth"

interface ExchangeProvider {
  id: string
  name: string
  description: string
  icon: string
  color: string
  features: string[]
}

const exchanges: ExchangeProvider[] = [
  {
    id: "okx",
    name: "OKX",
    description: "Connect with your OKX P2P trading account",
    icon: "🟡",
    color: "from-blue-500 to-blue-600",
    features: ["P2P Trading", "Team Management", "Advanced Analytics", "API Access"],
  },
  {
    id: "binance",
    name: "Binance",
    description: "Connect with your Binance P2P trading account",
    icon: "🟨",
    color: "from-yellow-500 to-yellow-600",
    features: ["P2P Trading", "High Volume", "Global Markets", "Advanced Tools"],
  },
  {
    id: "bybit",
    name: "Bybit",
    description: "Connect with your Bybit P2P trading account",
    icon: "🟣",
    color: "from-purple-500 to-purple-600",
    features: ["P2P Trading", "Derivatives", "Copy Trading", "Institutional"],
  },
]

export function ExchangeAuth() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  const oauthService = new ExchangeOAuthService()

  const handleExchangeLogin = async (exchangeId: string) => {
    setLoading(exchangeId)
    setError("")

    try {
      const config = await oauthService.getOAuthConfig(exchangeId)
      if (!config) {
        throw new Error(`${exchangeId.toUpperCase()} OAuth is not configured`)
      }

      const state = crypto.randomUUID()
      sessionStorage.setItem("oauth_state", state)
      sessionStorage.setItem("oauth_exchange", exchangeId)

      const authUrl = oauthService.generateAuthUrl(exchangeId, config, state)
      window.location.href = authUrl
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to initiate OAuth")
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="h-10 w-10 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Connect Your{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Exchange Account
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Securely connect your P2P trading account to access advanced automation features and team collaboration
            tools.
          </p>
        </div>

        {error && (
          <Alert className="bg-red-500/10 border-red-500/20 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Exchange Options */}
        <div className="grid gap-6 md:grid-cols-3">
          {exchanges.map((exchange) => (
            <Card
              key={exchange.id}
              className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300"
            >
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">{exchange.icon}</div>
                <CardTitle className="text-white text-xl">{exchange.name}</CardTitle>
                <CardDescription className="text-gray-300">{exchange.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {exchange.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleExchangeLogin(exchange.id)}
                  disabled={loading !== null}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/20 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
                >
                  {loading === exchange.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Connect {exchange.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Notice */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg max-w-3xl mx-auto shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-yellow-400 mt-1" />
              <div className="space-y-2">
                <h3 className="text-white font-semibold">Secure OAuth Connection</h3>
                <p className="text-gray-300 text-sm">
                  We use industry-standard OAuth 2.0 to securely connect to your exchange account. We never store your
                  exchange passwords and only request the minimum permissions needed for P2P automation.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-white/5">
                    <Shield className="mr-1 h-3 w-3" />
                    OAuth 2.0
                  </Badge>
                  <Badge variant="outline" className="text-orange-400 border-orange-400/30 bg-white/5">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    P2P Access
                  </Badge>
                  <Badge variant="outline" className="text-purple-400 border-purple-400/30 bg-white/5">
                    <Users className="mr-1 h-3 w-3" />
                    Team Data
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center mx-auto shadow-lg">
              <TrendingUp className="h-6 w-6 text-yellow-400" />
            </div>
            <h3 className="text-white font-semibold">Real Trader Data</h3>
            <p className="text-gray-400 text-sm">
              Access your actual completion rates, order history, and performance metrics
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center mx-auto shadow-lg">
              <Users className="h-6 w-6 text-orange-400" />
            </div>
            <h3 className="text-white font-semibold">Team Integration</h3>
            <p className="text-gray-400 text-sm">Automatically sync your exchange teams and member permissions</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center mx-auto shadow-lg">
              <Bot className="h-6 w-6 text-yellow-400" />
            </div>
            <h3 className="text-white font-semibold">Smart Automation</h3>
            <p className="text-gray-400 text-sm">Leverage your trading history for intelligent automation strategies</p>
          </div>
        </div>
      </div>
    </div>
  )
}
