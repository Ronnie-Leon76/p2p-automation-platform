"use client"

import { ExchangeWalletSetup } from "@/components/exchange-wallet-setup"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function OKXSetupPage() {
    const router = useRouter()

    const handleSetupComplete = async (data: any) => {
        try {
            const response = await fetch("/api/auth/okx/complete-setup", {
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
                toast.error(error.message || "Setup failed. Please try again.")
            }
        } catch (error) {
            console.error("Setup error:", error)
            toast.error("An unexpected error occurred. Please try again.")
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <ExchangeWalletSetup exchange="okx" onComplete={handleSetupComplete} />
        </div>
    )
}