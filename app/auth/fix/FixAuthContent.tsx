"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { getEnvironmentMode, isMockMode } from "@/lib/config/environment";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FixAuthContent() {
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  // Environment-aware auth
  const mockAuth = useMockAuth();
  const supabaseAuth = useSupabaseAuth();

  const {
    user: mockUser,
    isAuthenticated: mockIsAuth,
    logout: mockLogout,
  } = isDevelopment
    ? mockAuth
    : { user: null, isAuthenticated: false, logout: () => {} };

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
    setIsDevelopment(process.env.NODE_ENV === "development");
  }, []);

  const checkAuthState = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSupabaseUser(user);
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearEverything = async () => {
    setClearing(true);
    try {
      // 1. Clear Supabase auth
      await supabase.auth.signOut();
      console.log("✅ Cleared Supabase auth");

      // 2. Clear all localStorage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        console.log("✅ Cleared localStorage and sessionStorage");
      }

      // 3. Clear mock auth if in development
      if (isDevelopment && mockLogout) {
        mockLogout();
        console.log("✅ Called mock logout");
      }

      // 4. Force reload to clear any cached state
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1000);
    } catch (error) {
      console.error("Clear error:", error);
      // Force reload anyway
      window.location.reload();
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const hasAnyAuth = supabaseUser || (isDevelopment && mockIsAuth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <CardTitle className="text-white text-3xl">
            Fix Authentication
          </CardTitle>
          <p className="text-gray-300">
            Resolve authentication redirect issues
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current State */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Environment</h3>
              <p className="text-gray-300 text-sm">
                Mode: {getEnvironmentMode()}
              </p>
              <p className="text-gray-300 text-sm">
                Mock Mode: {isMockMode() ? "Yes" : "No"}
              </p>
              <p className="text-gray-300 text-sm">
                NODE_ENV: {process.env.NODE_ENV}
              </p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Auth Status</h3>
              <p className="text-gray-300 text-sm">
                Mock Auth:{" "}
                {isDevelopment && mockIsAuth ? "✅ Active" : "❌ None"}
              </p>
              <p className="text-gray-300 text-sm">
                Supabase: {supabaseUser ? "✅ Active" : "❌ None"}
              </p>
              <p className="text-gray-300 text-sm">
                Any Auth: {hasAnyAuth ? "✅ Yes" : "❌ No"}
              </p>
            </div>
          </div>

          {/* User Info */}
          {((isDevelopment && mockUser) || supabaseUser) && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Current User</h3>
              {isDevelopment && mockUser && (
                <div className="text-gray-300 text-sm">
                  <p>
                    Mock User: {mockUser.full_name} ({mockUser.email})
                  </p>
                  <p>Provider: {mockUser.provider}</p>
                </div>
              )}
              {supabaseUser && (
                <div className="text-gray-300 text-sm">
                  <p>Supabase User: {supabaseUser.email}</p>
                  <p>ID: {supabaseUser.id}</p>
                </div>
              )}
            </div>
          )}

          {/* Problem Explanation */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">
              🚨 What's Happening
            </h3>
            <div className="text-gray-300 text-sm space-y-1">
              <p>• You have active authentication (shown above)</p>
              <p>• Middleware is redirecting /auth → /dashboard</p>
              <p>• But something is causing a redirect loop</p>
              <p>• This creates the "stuck at redirecting" issue</p>
            </div>
          </div>

          {/* Solution */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">💡 Solution</h3>
            <div className="text-gray-300 text-sm space-y-1">
              <p>• Clear ALL authentication sessions</p>
              <p>• Clear browser storage completely</p>
              <p>• Force reload to reset application state</p>
              <p>• Start fresh with login page</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              onClick={clearEverything}
              disabled={clearing}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
              size="lg"
            >
              {clearing ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Clearing Everything...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Clear Everything & Go to Login
                </div>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={checkAuthState}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Check
              </Button>

              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Try Dashboard
              </Button>
            </div>
          </div>

          {/* Manual Links */}
          <div className="text-center text-sm text-gray-400">
            <p>Manual navigation:</p>
            <div className="flex justify-center gap-4 mt-2">
              <a
                href="/auth/login"
                className="text-blue-400 hover:text-blue-300"
              >
                Login
              </a>
              <a
                href="/auth/signup"
                className="text-blue-400 hover:text-blue-300"
              >
                Signup
              </a>
              <a
                href="/dashboard"
                className="text-blue-400 hover:text-blue-300"
              >
                Dashboard
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
