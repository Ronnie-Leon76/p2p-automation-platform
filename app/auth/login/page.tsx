import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <AuthForm mode="login" />
    </div>
  )
}

export const metadata = {
  title: "Sign In - P2P Automation Platform",
  description: "Sign in with your exchange account to access your P2P trading automation dashboard",
}