"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { getEnvironmentMode, isMockMode } from "@/lib/config/environment";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthDebugPage() {
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Environment-aware auth
  const mockAuth = useMockAuth();
  const supabaseAuth = useSupabaseAuth();
  
  const { user: mockUser, isAuthenticated: mockIsAuth } = isDevelopment 
    ? mockAuth 
    : { user: null, isAuthenticated: false };
  
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
        error: userError,
      } = await supabase.auth.getUser();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      setSupabaseUser(user);
      setSupabaseSession(session);

      console.log("🔍 Auth Debug:", {
        supabaseUser: user,
        supabaseSession: session,
        mockUser,
        mockAuth: mockIsAuth,
        environmentMode: getEnvironmentMode(),
        isMockMode: isMockMode(),
        userError,
        sessionError,
      });
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllAuth = async () => {
    try {
      // Clear Supabase
      await supabase.auth.signOut();

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.clear();
      }

      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error("Clear auth error:", error);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-black/20 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Authentication Debug
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Environment Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  Environment
                </h3>
                <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-300">
                    Mode:{" "}
                    <span className="text-yellow-400">
                      {getEnvironmentMode()}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    Mock Mode:{" "}
                    <span className="text-yellow-400">
                      {isMockMode() ? "Yes" : "No"}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    NODE_ENV:{" "}
                    <span className="text-yellow-400">
                      {process.env.NODE_ENV}
                    </span>
                  </p>
                </div>
              </div>

              {/* Mock Auth */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  Mock Authentication
                </h3>
                <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-300">
                    Authenticated:{" "}
                    <span className="text-yellow-400">
                      {isDevelopment && mockIsAuth ? "Yes" : "No"}
                    </span>
                  </p>
                  {mockUser && (
                    <>
                      <p className="text-gray-300">
                        Name:{" "}
                        <span className="text-yellow-400">
                          {mockUser.full_name}
                        </span>
                      </p>
                      <p className="text-gray-300">
                        Email:{" "}
                        <span className="text-yellow-400">
                          {mockUser.email}
                        </span>
                      </p>
                      <p className="text-gray-300">
                        Provider:{" "}
                        <span className="text-yellow-400">
                          {mockUser.provider}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Supabase Auth */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  Supabase Authentication
                </h3>
                <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-300">
                    User:{" "}
                    <span className="text-yellow-400">
                      {supabaseUser ? "Logged In" : "None"}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    Session:{" "}
                    <span className="text-yellow-400">
                      {supabaseSession ? "Active" : "None"}
                    </span>
                  </p>
                  {supabaseUser && (
                    <>
                      <p className="text-gray-300">
                        Email:{" "}
                        <span className="text-yellow-400">
                          {supabaseUser.email}
                        </span>
                      </p>
                      <p className="text-gray-300">
                        ID:{" "}
                        <span className="text-yellow-400">
                          {supabaseUser.id}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Local Storage */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  Local Storage
                </h3>
                <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-300">
                    Mock Session:{" "}
                    <span className="text-yellow-400">
                      {typeof window !== "undefined" &&
                      localStorage.getItem("mock_auth_session")
                        ? "Present"
                        : "None"}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    Mock Credentials:{" "}
                    <span className="text-yellow-400">
                      {typeof window !== "undefined" &&
                      localStorage.getItem("mock_exchange_credentials")
                        ? "Present"
                        : "None"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={checkAuthState}
                variant="outline"
                className="bg-white/5 border-white/10 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Check
              </Button>

              <Button
                onClick={clearAllAuth}
                className="bg-red-600 hover:bg-red-700"
              >
                Clear All Auth
              </Button>

              <Button
                onClick={() => router.push("/auth/login")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Login
              </Button>

              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="bg-white/5 border-white/10 text-white"
              >
                Try Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
