"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, ExternalLink, Plus, Settings } from "lucide-react"

const EXCHANGES = [
  {
    id: "okx",
    name: "OKX",
    description: "Leading global crypto exchange with advanced P2P features",
    color: "from-blue-500 to-blue-600",
    logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/okx-logo_udbnjv.png",
    status: "available",
    features: ["P2P Trading", "Spot Trading", "Futures", "Options"],
    setupUrl: "/auth/okx/setup",
  },
  {
    id: "binance",
    name: "Binance",
    description: "World's largest cryptocurrency exchange by trading volume",
    color: "from-yellow-400 to-yellow-500",
    logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/binance-logo_weqahc.png",
    status: "coming-soon",
    features: ["P2P Trading", "Spot Trading", "Futures", "Margin"],
    setupUrl: "/auth/binance/setup",
    estimatedLaunch: "Q2 2024",
  },
  {
    id: "bybit",
    name: "Bybit",
    description: "Derivatives-focused exchange with growing P2P platform",
    color: "from-orange-500 to-orange-600",
    logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/bybit-logo_famhwh.png",
    status: "coming-soon",
    features: ["P2P Trading", "Derivatives", "Copy Trading", "NFTs"],
    setupUrl: "/auth/bybit/setup",
    estimatedLaunch: "Q3 2024",
  },
]

export function ExchangeSelector() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Connect Your Exchange</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Connect your cryptocurrency exchange accounts to start automating your P2P trading operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXCHANGES.map((exchange) => (
          <Card key={exchange.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`h-10 w-10 bg-gradient-to-r ${exchange.color} rounded-lg flex items-center justify-center`}
                >
                  <img
                    src={exchange.logo || "/placeholder.svg"}
                    alt={exchange.name}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      e.currentTarget.nextElementSibling!.textContent = exchange.name.charAt(0)
                    }}
                  />
                  <span className="text-white font-bold text-sm hidden"></span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-lg">{exchange.name}</CardTitle>
                    {exchange.status === "available" ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <CardDescription className="text-gray-300 text-sm">{exchange.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-white font-medium text-sm">Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {exchange.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-white/20 text-gray-300">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {exchange.status === "coming-soon" && exchange.estimatedLaunch && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-sm">Estimated Launch:</span>
                    <span className="text-blue-300 text-sm font-medium">{exchange.estimatedLaunch}</span>
                  </div>
                </div>
              )}

              <Button
                className={`w-full ${
                  exchange.status === "available"
                    ? `bg-gradient-to-r ${exchange.color} hover:opacity-90 text-white`
                    : "bg-white/5 border border-white/20 text-white hover:bg-white/10"
                }`}
                variant={exchange.status === "available" ? "default" : "outline"}
                onClick={() => router.push(exchange.setupUrl)}
              >
                {exchange.status === "available" ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect {exchange.name}
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Learn More
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Need Help?
          </CardTitle>
          <CardDescription className="text-gray-300">
            Having trouble connecting your exchange? Check out our setup guides and documentation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              <ExternalLink className="w-4 h-4 mr-2" />
              Setup Guide
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}