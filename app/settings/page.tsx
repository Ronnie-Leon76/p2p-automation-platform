"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { VerificationManagement } from "@/components/verification-management";
import { getEnvironmentMode, isMockMode } from "@/lib/config/environment";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Bell,
  Database,
  Globe,
  Key,
  LogOut,
  RefreshCw,
  Shield,
  UserCheck,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function SettingsContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session?.user && !error) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Settings auth check failed:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      if (isMockMode()) {
        // Mock mode logout
        console.log("🎭 Mock mode logout");
        router.push("/auth");
      } else {
        // Real authentication logout
        console.log("🔐 Real authentication logout");
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Logout error:", error);
          throw error;
        }

        // Clear any additional app state if needed
        router.push("/auth");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, redirect to auth page
      router.push("/auth");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getCurrentMode = () => {
    return getEnvironmentMode();
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          Mode: {getCurrentMode().toUpperCase()}
        </div>
      </div>

      {/* User Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your current account details and authentication status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Email</div>
              <div className="text-sm">{user?.email || "Not available"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">User ID</div>
              <div className="text-sm font-mono text-xs">
                {user?.id || "Not available"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Authentication Status
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Authenticated
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      Not Authenticated
                    </span>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Environment
              </div>
              <div className="text-sm">
                {isMockMode() ? "Mock/Development" : "Production/Local"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Verification */}
      {user?.id && <VerificationManagement userId={user.id} />}

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Authentication
          </CardTitle>
          <CardDescription>
            Manage your security settings and authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Change Password</div>
                <div className="text-sm text-muted-foreground">
                  Update your account password
                </div>
              </div>
              <Button variant="outline" disabled>
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </div>
              </div>
              <Button variant="outline" disabled>
                <Shield className="h-4 w-4 mr-2" />
                Configure 2FA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your application experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Manage email and push notifications
                </div>
              </div>
              <Button variant="outline" disabled>
                <Bell className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Data Export</div>
                <div className="text-sm text-muted-foreground">
                  Download your account data
                </div>
              </div>
              <Button variant="outline" disabled>
                <Database className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Account Session
          </CardTitle>
          <CardDescription>
            Manage your current session and switch between accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Logging out will end your current session. You'll need to sign in
              again to access your account.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Logout from Current Account</div>
              <div className="text-sm text-muted-foreground">
                Sign out and return to the login page to access other accounts
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 bg-black/20 backdrop-blur-lg px-4">
            <SidebarTrigger className="-ml-1 text-white" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white">
                Settings
              </h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <SettingsContent />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
