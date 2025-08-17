"use client";

import { isMockMode } from "@/lib/config/environment";
import { DevAuthForm } from "./dev-auth-form";
import { PremiumAuthForm } from "./premium-auth-form";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  // Convert login to signin for PremiumAuthForm
  const premiumMode = mode === "login" ? "signin" : "signup";

  // Use development form only in mock mode for testing
  if (isMockMode() && process.env.NODE_ENV === "development") {
    return <DevAuthForm mode={mode} />;
  }

  // Use premium authentication design for all other modes
  return <PremiumAuthForm mode={premiumMode} />;
}
