"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataRefreshControl } from "@/components/data-refresh-control";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationManagement } from "@/components/verification-management";
import { useExchangeData } from "@/hooks/use-exchange-data";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useAuth } from "@/hooks/use-auth";
import { getAuthPort } from "@/lib/composition/auth-composer";
import { getEnvironmentMode, isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Database,
  Eye,
  EyeOff,
  LogOut,
  Save,
  Settings as SettingsIcon,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    trade_alerts: boolean;
    system_updates: boolean;
  };
  privacy: {
    profile_visible: boolean;
    stats_visible: boolean;
    last_seen_visible: boolean;
  };
  trading: {
    auto_accept_orders: boolean;
    max_concurrent_orders: number;
    preferred_currency: string;
    risk_tolerance: "low" | "medium" | "high";
  };
  security: {
    two_factor_enabled: boolean;
    session_timeout: number;
    api_access_enabled: boolean;
  };
}

interface SecurityLog {
  id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  success: boolean;
  details?: string;
}

function SettingsContent() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Use environment-appropriate auth
  const supabaseAuth = useAuth();
  const mockAuth = isMockMode()
    ? useMockAuth()
    : { user: null, isAuthenticated: false, isLoading: false };

  // Select auth based on environment
  const { user, isAuthenticated, isLoading } = isMockMode()
    ? mockAuth
    : supabaseAuth;

  // Use the new exchange data hook
  const exchangeData = useExchangeData(user?.id || null, "okx", {
    autoRefresh: true,
    refreshInterval: 10, // 10 minutes for settings
    includeTypes: ["profile", "balance"],
    onRefreshStart: () => console.log("🔄 Settings data refresh started"),
    onRefreshComplete: () => console.log("✅ Settings data refresh completed"),
    onRefreshError: (error) =>
      console.error("❌ Settings data refresh failed:", error),
  });

  // Mock settings data
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: false,
      trade_alerts: true,
      system_updates: true,
    },
    privacy: {
      profile_visible: true,
      stats_visible: true,
      last_seen_visible: false,
    },
    trading: {
      auto_accept_orders: false,
      max_concurrent_orders: 5,
      preferred_currency: "KES",
      risk_tolerance: "medium",
    },
    security: {
      two_factor_enabled: false,
      session_timeout: 30,
      api_access_enabled: true,
    },
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  useEffect(() => {
    setIsClient(true);
    if (isAuthenticated) {
      generateMockSecurityLogs();
    }
  }, [isAuthenticated]);

  const generateMockSecurityLogs = () => {
    const logs: SecurityLog[] = [
      {
        id: "1",
        action: "Login",
        ip_address: "192.168.1.100",
        user_agent: "Chrome 118.0.0.0",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        success: true,
        details: "Successful login from desktop",
      },
      {
        id: "2",
        action: "Settings Update",
        ip_address: "192.168.1.100",
        user_agent: "Chrome 118.0.0.0",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        success: true,
        details: "Updated notification preferences",
      },
      {
        id: "3",
        action: "Failed Login",
        ip_address: "103.45.67.89",
        user_agent: "Unknown Bot",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        success: false,
        details: "Invalid password attempt",
      },
      {
        id: "4",
        action: "API Key Generated",
        ip_address: "192.168.1.100",
        user_agent: "Chrome 118.0.0.0",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        success: true,
        details: "New API key created for automation",
      },
    ];
    setSecurityLogs(logs);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (!isMockMode()) {
        await getAuthPort().signOut();
      }
      // Clear any local storage for mock mode
      if (isMockMode()) {
        localStorage.removeItem("mock_auth_user");
        localStorage.removeItem("mock_exchange_selection");
      }

      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to the database
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      console.log("Settings saved:", settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettingsSection = (
    section: keyof UserSettings,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  // Show loading state
  if (!isClient || isLoading || exchangeData.isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Settings</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Show login prompt if no user is authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Settings</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Authentication Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Please sign in to access your settings.
                </p>
                <Button onClick={() => router.push("/auth")}>Sign In</Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Account Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your account preferences and security settings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(true)}
                disabled={isLoggingOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Data Refresh Control */}
          <DataRefreshControl
            isRefreshing={exchangeData.isRefreshing}
            lastRefresh={exchangeData.lastRefresh}
            onRefresh={exchangeData.refreshData}
            onRefreshDataType={exchangeData.refreshDataType}
            onClearCache={exchangeData.clearCacheAndReload}
            getDataStatus={exchangeData.getDataStatus}
            errors={exchangeData.errors}
          />

          {/* Environment Info */}
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  Running in <strong>{getEnvironmentMode()}</strong> mode
                  {isMockMode() && " with mock data"}
                </span>
                <Badge variant="outline">
                  {isMockMode() ? "Development" : "Production"}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>

          {/* Account Overview */}
          {exchangeData.profile?.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  Account Overview
                </CardTitle>
                <CardDescription>
                  Your account information and verification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Username
                    </Label>
                    <p className="text-sm text-gray-900">
                      {exchangeData.profile.data.nickName || "Not set"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      User Type
                    </Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900">
                        {exchangeData.profile.data.userType || "Regular"}
                      </p>
                      <Badge variant="outline">
                        {exchangeData.profile.data.userType === "0"
                          ? "Regular"
                          : "VIP"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Registration
                    </Label>
                    <p className="text-sm text-gray-900">
                      {exchangeData.profile.data.registerTime
                        ? formatDistanceToNow(
                            new Date(
                              Number(exchangeData.profile.data.registerTime)
                            ),
                            { addSuffix: true }
                          )
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Data Source
                    </Label>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-900">
                        Live Exchange Data
                      </span>
                      <Badge variant="secondary">Real-time</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure your general account preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="max-orders">Max Concurrent Orders</Label>
                      <Input
                        id="max-orders"
                        type="number"
                        value={settings.trading.max_concurrent_orders}
                        onChange={(e) =>
                          updateSettingsSection(
                            "trading",
                            "max_concurrent_orders",
                            parseInt(e.target.value)
                          )
                        }
                        min="1"
                        max="20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred-currency">
                        Preferred Currency
                      </Label>
                      <Input
                        id="preferred-currency"
                        value={settings.trading.preferred_currency}
                        onChange={(e) =>
                          updateSettingsSection(
                            "trading",
                            "preferred_currency",
                            e.target.value
                          )
                        }
                        placeholder="e.g., KES, USD, EUR"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-accept Orders</Label>
                        <p className="text-sm text-gray-600">
                          Automatically accept orders that match your criteria
                        </p>
                      </div>
                      <Switch
                        checked={settings.trading.auto_accept_orders}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "trading",
                            "auto_accept_orders",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "notifications",
                            "email",
                            checked
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "notifications",
                            "push",
                            checked
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Trade Alerts</Label>
                        <p className="text-sm text-gray-600">
                          Get notified about trade opportunities and completions
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.trade_alerts}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "notifications",
                            "trade_alerts",
                            checked
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Updates</Label>
                        <p className="text-sm text-gray-600">
                          Receive notifications about system updates and
                          maintenance
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.system_updates}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "notifications",
                            "system_updates",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control what information is visible to other users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-gray-600">
                          Make your profile visible to other traders
                        </p>
                      </div>
                      <Switch
                        checked={settings.privacy.profile_visible}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "privacy",
                            "profile_visible",
                            checked
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Statistics Visibility</Label>
                        <p className="text-sm text-gray-600">
                          Show your trading statistics to other users
                        </p>
                      </div>
                      <Switch
                        checked={settings.privacy.stats_visible}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "privacy",
                            "stats_visible",
                            checked
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Last Seen Visibility</Label>
                        <p className="text-sm text-gray-600">
                          Show when you were last active
                        </p>
                      </div>
                      <Switch
                        checked={settings.privacy.last_seen_visible}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "privacy",
                            "last_seen_visible",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and API access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.two_factor_enabled}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "security",
                            "two_factor_enabled",
                            checked
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>API Access</Label>
                        <p className="text-sm text-gray-600">
                          Allow API access for automation and integrations
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.api_access_enabled}
                        onCheckedChange={(checked) =>
                          updateSettingsSection(
                            "security",
                            "api_access_enabled",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>

                  {settings.security.api_access_enabled && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label>API Key</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value="pk_live_123456789abcdefghijklmnop"
                        readOnly
                        className="font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Regenerate
                        </Button>
                        <Button variant="outline" size="sm">
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">
                      Security Log
                    </Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Recent security activities on your account
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {securityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                log.success ? "bg-green-500" : "bg-red-500"
                              }`}
                            ></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {log.action}
                              </p>
                              <p className="text-xs text-gray-600">
                                {log.ip_address} •{" "}
                                {formatDistanceToNow(new Date(log.timestamp), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={log.success ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {log.success ? "Success" : "Failed"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification" className="space-y-6">
              <VerificationManagement userId={user?.id || "mock-user"} />
            </TabsContent>
          </Tabs>

          {/* Account Balances from Exchange */}
          {exchangeData.balance?.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  Account Balances
                </CardTitle>
                <CardDescription>
                  Your current balances on connected exchanges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(exchangeData.balance.data).map(
                    ([currency, balance]: [string, any]) => (
                      <div key={currency} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-700">
                            {currency}
                          </span>
                          <Badge variant="outline">
                            {balance?.currencySymbol || currency}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Available:</span>
                            <span className="font-medium">
                              {balance?.available ||
                                balance?.availableAmount ||
                                "0.00"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">On Hold:</span>
                            <span className="font-medium">
                              {balance?.onHoldAmount || "0.00"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You'll need to authenticate
              again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}

