"use client";

import { useMockAuth } from "@/hooks/use-mock-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isMockMode } from "@/lib/config/environment";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const mockAuth = useMockAuth();
  const liveAuth = useSupabaseAuth();

  const authState = isMockMode()
    ? { isLoading: false, isAuthenticated: mockAuth.isAuthenticated }
    : { isLoading: liveAuth.isLoading, isAuthenticated: liveAuth.isAuthenticated };

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
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
