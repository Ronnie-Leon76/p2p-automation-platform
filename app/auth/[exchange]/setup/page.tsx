"use client";

import { ExchangeWalletSetup } from "@/components/exchange-wallet-setup"
import { notFound } from "next/navigation"
import { useParams, useRouter } from "next/navigation"

export default function ExchangeSetupPage() {
  const params = useParams()
  const router = useRouter()
  const exchange = params.exchange as string

  if (!["okx", "binance", "bybit"].includes(exchange)) {
    notFound()
  }

  const handleSetupComplete = async (data: any) => {
    try {
      const response = await fetch(`/api/auth/${exchange}/complete-setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        const error = await response.json()
        console.error("Setup failed:", error)
      }
    } catch (error) {
      console.error("Setup error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <ExchangeWalletSetup exchange={exchange as "okx" | "binance" | "bybit"} onComplete={handleSetupComplete} />
    </div>
  )
}