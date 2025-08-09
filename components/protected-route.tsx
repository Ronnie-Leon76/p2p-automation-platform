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
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useMockAuth();
  const router = useRouter();

  useEffect(() => {
    console.log(
      `🛡️  ProtectedRoute check: isLoading=${isLoading}, isAuthenticated=${isAuthenticated}, user=${
        user?.full_name || "none"
      }`
    );

    // In development mode, check mock auth
    if (MockAuthService.isDevelopment()) {
      // Wait for loading to complete before making decisions
      if (isLoading) {
        console.log(`⏳ Still loading, waiting...`);
        return;
      }

      if (!isAuthenticated) {
        console.log(`🔄 Redirecting to ${redirectTo} - not authenticated`);
        // Only redirect if we're not already on the auth page
        if (window.location.pathname !== "/auth") {
          router.push(redirectTo);
        }
        return;
      }

      if (isAuthenticated) {
        console.log(
          `✅ User is authenticated (${user?.full_name}), showing protected content`
        );
      }
    }
    // TODO: In production, check real Supabase auth
  }, [isAuthenticated, isLoading, user, router, redirectTo]);

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
