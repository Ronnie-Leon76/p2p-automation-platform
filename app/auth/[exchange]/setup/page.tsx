import { ExchangeWalletSetup } from "@/components/exchange-wallet-setup"
import { notFound } from "next/navigation"

interface SetupPageProps {
  params: Promise<{ exchange: string }>
}

export default async function ExchangeSetupPage({ params }: SetupPageProps) {
  const { exchange } = await params

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
        window.location.href = "/dashboard"
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