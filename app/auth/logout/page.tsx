"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { getAuthPort } from "@/lib/composition/auth-composer";
import { isMockMode } from "@/lib/config/environment";
import { LogOut, RefreshCw, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LogoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [isClient, setIsClient] = useState(false);

  const supabaseAuth = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { user, isAuthenticated } =
    isClient && isMockMode()
      ? { user: null, isAuthenticated: false }
      : supabaseAuth;

  const handleClearAllSessions = async () => {
    setIsLoading(true);
    setSuccess("");

    try {
      if (isMockMode() && typeof window !== "undefined") {
        localStorage.removeItem("mock_auth_session");
        localStorage.removeItem("mock_exchange_credentials");
      }

      if (!isMockMode()) {
        await getAuthPort().signOut();
      }

      setSuccess("All sessions cleared successfully!");

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("Clear sessions error:", error);
      setSuccess("Sessions cleared (with some warnings)");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !user) {
      setTimeout(() => {
        router.push("/auth/login");
      }, 1000);
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader className="text-center">
          <LogOut className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <CardTitle className="text-white text-2xl">Clear Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAuthenticated && user && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                  <p className="text-gray-500 text-xs">P2P Trading Account</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 text-center">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleClearAllSessions}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Clearing Sessions...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Clear All Sessions
                </div>
              )}
            </Button>

            <Button
              onClick={() => router.push("/auth/login")}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Go to Login
            </Button>
          </div>

          <div className="text-center text-sm text-gray-400">
            <p>This will clear both mock and real authentication sessions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
