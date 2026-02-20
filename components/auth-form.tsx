"use client";

import { PremiumAuthForm } from "./premium-auth-form";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  // Convert login to signin for PremiumAuthForm
  const premiumMode = mode === "login" ? "signin" : "signup";

  // Use premium authentication design for all other modes
  return <PremiumAuthForm mode={premiumMode} />;
}
