"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Calendar, CheckCircle, Clock, Rocket, Star } from "lucide-react"

const EXCHANGE_CONFIGS = {
  binance: {
    name: "Binance",
    color: "from-yellow-400 to-yellow-500",
    logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/binance-logo_weqahc.png",
    features: [
      "Largest global trading volume",
      "Advanced P2P trading features",
      "Multiple payment methods",
      "Global market access",
      "Advanced order types",
    ],
    estimatedLaunch: "Q2 2024",
    priority: "High",
  },
  bybit: {
    name: "Bybit",
    color: "from-orange-500 to-orange-600",
    logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/bybit-logo_famhwh.png",
    features: [
      "Derivatives trading focus",
      "P2P trading platform",
      "Copy trading features",
      "Advanced charting tools",
      "Mobile-first experience",
    ],
    estimatedLaunch: "Q3 2024",
    priority: "Medium",
  },
}

interface ExchangeComingSoonProps {
  exchange: "binance" | "bybit"
}

export function ExchangeComingSoon({ exchange }: ExchangeComingSoonProps) {
  const router = useRouter()
  const config = EXCHANGE_CONFIGS[exchange]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Exchange Header */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center`}>
              <img
                src={config.logo || "/placeholder.svg"}
                alt={config.name}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling!.textContent = config.name.charAt(0)
                }}
              />
              <span className="text-white font-bold text-lg hidden"></span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-white">{config.name} Integration</CardTitle>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <Rocket className="w-3 h-3 mr-1" />
                  Coming Soon
                </Badge>
              </div>
              <CardDescription className="text-gray-300">
                We're working hard to bring {config.name} integration to our platform
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Coming Soon Details */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Development Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Estimated Launch:</span>
                <Badge variant="outline" className="border-green-500/30 text-green-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  {config.estimatedLaunch}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Priority:</span>
                <Badge
                  variant="outline"
                  className={`${
                    config.priority === "High"
                      ? "border-red-500/30 text-red-400"
                      : "border-yellow-500/30 text-yellow-400"
                  }`}
                >
                  <Star className="w-3 h-3 mr-1" />
                  {config.priority}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">API Integration:</span>
                <span className="text-blue-400">In Progress</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Testing Phase:</span>
                <span className="text-gray-400">Pending</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-3">🚀 What's Coming</h4>
            <ul className="space-y-2">
              {config.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="text-yellow-400 font-medium mb-2">📧 Get Notified</h4>
            <p className="text-gray-300 text-sm mb-3">
              Want to be the first to know when {config.name} integration is ready? We'll send you an email as soon as
              it's available.
            </p>
            <Button variant="outline" className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
              <Bell className="w-4 h-4 mr-2" />
              Notify Me When Available
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Options */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Available Now</CardTitle>
          <CardDescription className="text-gray-300">
            While we work on {config.name} integration, you can start with OKX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">OKX</span>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium">OKX Integration</h4>
              <p className="text-gray-300 text-sm">Full P2P trading automation available now</p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Available
            </Badge>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/5"
              onClick={() => router.push("/auth/okx/setup")}
            >
              Setup OKX Integration
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}