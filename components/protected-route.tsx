"use client";

import { useMockAuth } from "@/hooks/use-mock-auth";
import { MockAuthService } from "@/lib/auth/mock-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useMockAuth();
  const router = useRouter();

  useEffect(() => {
    // In development mode, check mock auth
    if (MockAuthService.isDevelopment()) {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }
    // TODO: In production, check real Supabase auth
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login redirect in development if not authenticated
  if (MockAuthService.isDevelopment() && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
