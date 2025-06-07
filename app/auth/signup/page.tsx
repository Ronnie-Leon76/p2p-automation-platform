import { AuthForm } from "@/components/auth-form"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <AuthForm mode="signup" />
    </div>
  )
}

export const metadata = {
  title: "Get Started - P2P Automation Platform",
  description: "Connect your exchange account to start automating your P2P trading operations",
}