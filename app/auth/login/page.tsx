import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
  return <AuthForm mode="login" />
}

export const metadata = {
  title: "Sign In - P2P Automation Platform",
  description: "Sign in with your exchange account to access your P2P trading automation dashboard",
}