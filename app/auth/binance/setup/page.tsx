"use client"

import { ExchangeWalletSetup } from "@/components/exchange-wallet-setup"
import { useRouter } from "next/navigation"

export default function BinanceSetupPage() {
  const router = useRouter()

  const handleSetupComplete = async (data: any) => {
    try {
      const response = await fetch("/api/auth/binance/complete-setup", {
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
        // You could add toast notification here
      }
    } catch (error) {
      console.error("Setup error:", error)
      // You could add toast notification here
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <ExchangeWalletSetup exchange="binance" onComplete={handleSetupComplete} />
    </div>
  )
}