"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, AlertCircle, Loader2 } from "lucide-react"

interface AuthFormProps {
  mode: "login" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null)
  const router = useRouter()

  const handleExchangeAuth = async (exchange: string) => {
    setIsLoading(true)
    setSelectedExchange(exchange)
    setError("")

    try {
      // Redirect to exchange OAuth
      const authUrl = `/api/auth/${exchange}/authorize`
      window.location.href = authUrl
    } catch (error: any) {
      setError(error.message)
      setIsLoading(false)
      setSelectedExchange(null)
    }
  }

  const exchanges = [
    {
      id: "okx",
      name: "OKX",
      description: "Connect with your OKX account",
      logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/okx-logo_udbnjv.png",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "binance",
      name: "Binance",
      description: "Connect with your Binance account",
      logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/binance-logo_weqahc.png",
      color: "from-black-400 to-black-500",
    },
    {
      id: "bybit",
      name: "Bybit",
      description: "Connect with your Bybit account",
      logo: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/bybit-logo_famhwh.png",
      color: "from-orange-500 to-orange-600",
    },
  ]

  return (
    <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Bot className="h-7 w-7 text-black" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-white">
          {mode === "login" ? "Welcome back" : "Get started"}
        </CardTitle>
        <CardDescription className="text-gray-300">
          {mode === "login"
            ? "Sign in with your exchange account to access your P2P automation dashboard"
            : "Connect your exchange account to start automating your P2P trading"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-400 text-center mb-4">Choose your exchange to continue</p>

          {exchanges.map((exchange) => (
            <Button
              key={exchange.id}
              variant="outline"
              className="w-full h-16 border-white/20 text-white hover:bg-white/10 hover:border-white/30 flex items-center justify-start gap-4 p-4"
              onClick={() => handleExchangeAuth(exchange.id)}
              disabled={isLoading}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`h-10 w-10 bg-gradient-to-r ${exchange.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <img
                    src={exchange.logo || "/placeholder.svg"}
                    alt={exchange.name}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.currentTarget.style.display = "none"
                      e.currentTarget.nextElementSibling!.textContent = exchange.name.charAt(0)
                    }}
                  />
                  <span className="text-white font-bold text-sm hidden"></span>
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-white">{exchange.name}</div>
                  <div className="text-sm text-gray-400">{exchange.description}</div>
                </div>
              </div>
              {isLoading && selectedExchange === exchange.id && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </Button>
          ))}
        </div>

        <div className="text-center text-sm pt-4">
          <span className="text-gray-400">
            {mode === "login" ? "New to P2P Automation?" : "Already have an account?"}
          </span>{" "}
          <Link
            href={mode === "login" ? "/auth/signup" : "/auth/login"}
            className="text-yellow-400 hover:text-yellow-300 font-medium"
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </Link>
        </div>

        <div className="text-center text-xs text-gray-500 pt-2">
          <p>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-yellow-400 hover:text-yellow-300">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-yellow-400 hover:text-yellow-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}