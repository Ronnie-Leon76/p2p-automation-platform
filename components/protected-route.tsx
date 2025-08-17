"use client";

import { isMockMode } from "@/lib/config/environment";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (isMockMode()) {
        // In mock mode, import and use mock auth
        try {
          const { useMockAuth } = await import("@/hooks/use-mock-auth");
          // For mock mode, we'd need to handle this differently
          // For now, assume authenticated in mock mode since middleware handles it
          setIsAuthenticated(true);
        } catch {
          setIsAuthenticated(false);
        }
      } else {
        // In local/production mode, use Supabase auth
        try {
          const supabase = createClient();
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          console.log(`🛡️ ProtectedRoute Supabase check:`, {
            hasSession: !!session,
            user: session?.user?.email || "none",
            error: error?.message || "none",
          });

          setIsAuthenticated(!!session && !error);
        } catch (error) {
          console.error("🚨 ProtectedRoute auth check failed:", error);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

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

  // Show login redirect if not authenticated
  if (!isAuthenticated) {
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
