"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { OKXConfiguration } from "@/components/okx-configuration";
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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardBootstrap } from "@/hooks/use-dashboard-bootstrap";

interface OKXCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
}

interface OKXUserData {
  userInfo?: any;
  balance?: any;
  paymentMethods?: any;
  isConnected: boolean;
}

export default function OKXExchangePage() {
  const [userData, setUserData] = useState<OKXUserData>({
    isConnected: false,
  });

  const [loading, setLoading] = useState(false);
  useDashboardBootstrap("okx", ["profile", "merchant_profile", "balance", "payment_methods"]);

  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const [credentialsRes, cacheRes] = await Promise.all([
        fetch("/api/okx/credentials", { cache: "no-store", credentials: "include" }),
        fetch("/api/okx/cache?exchange=okx", { cache: "no-store", credentials: "include" }),
      ]);

      const credentialsPayload = credentialsRes.ok ? await credentialsRes.json() : null;
      const cachePayload = cacheRes.ok ? await cacheRes.json() : null;
      const records = (cachePayload?.records || []) as Array<{ data_type: string; data: any }>;

      const profile = records.find((r) => r.data_type === "merchant_profile")?.data
        || records.find((r) => r.data_type === "profile")?.data;
      const balance = records.find((r) => r.data_type === "balance")?.data;
      const paymentMethods = records.find((r) => r.data_type === "payment_methods")?.data;

      setUserData({
        userInfo: profile,
        balance,
        paymentMethods,
        isConnected: Boolean(credentialsPayload?.credential?.is_active),
      });
    } catch (error) {
      console.error("Error loading cached data:", error);
    }
  };

  const loadUserData = async (_creds?: OKXCredentials) => {
    setLoading(true);
    try {
      await loadCachedData();
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionChange = (isConnected: boolean) => {
    setUserData((prev) => ({ ...prev, isConnected }));
  };

  const handleCredentialsSaved = (_newCredentials: OKXCredentials) => {
    void loadUserData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 bg-black/20 backdrop-blur-lg px-4">
            <SidebarTrigger className="-ml-1 text-white" />
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-400" />
              <h1 className="text-lg font-semibold text-white">OKX Exchange</h1>
              {userData.isConnected && (
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-green-400 border-green-500/30"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
          </header>

          <div className="min-h-screen bg-gray-50/50">
            <div className="space-y-8 p-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    OKX Exchange Configuration
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Configure your OKX API credentials and manage
                    exchange-specific data
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => loadUserData()}
                    disabled={loading || !userData.isConnected}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Refresh Data
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* API Configuration */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-900">
                          API Configuration
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          Configure your OKX API credentials to enable trading
                          automation
                        </CardDescription>
                      </div>
                    </div>
                    {userData.isConnected && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <OKXConfiguration
                    onConnectionChange={handleConnectionChange}
                    onCredentialsSaved={handleCredentialsSaved}
                  />
                </CardContent>
              </Card>

              {/* Exchange Profile Data */}
              {userData.isConnected && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Exchange Profile Data
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Your OKX account information and trading data
                      </p>
                    </div>
                  </div>

                  <Tabs defaultValue="balance" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                      <TabsTrigger value="balance" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Balance
                      </TabsTrigger>
                      <TabsTrigger value="profile" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Profile
                      </TabsTrigger>
                      <TabsTrigger value="payments" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payments
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="balance" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {userData.balance &&
                          Object.entries(userData.balance).map(
                            ([currency, balance]: [string, any]) => (
                              <Card
                                key={currency}
                                className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow"
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-blue-600" />
                                      </div>
                                      <div>
                                        <CardTitle className="text-gray-900">
                                          {currency}
                                        </CardTitle>
                                        <p className="text-xs text-gray-500">
                                          OKX Balance
                                        </p>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className="bg-orange-50 text-orange-700 border-orange-200"
                                    >
                                      OKX
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-2xl font-bold text-gray-900">
                                        {balance?.available || "0.00"}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Available
                                      </p>
                                    </div>
                                    {balance?.frozen &&
                                      parseFloat(balance.frozen) > 0 && (
                                        <div className="pt-2 border-t border-gray-100">
                                          <p className="text-sm text-yellow-600 font-medium">
                                            Frozen: {balance.frozen}
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          )}
                      </div>
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-4">
                      <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <CardTitle className="text-gray-900">
                                User Information
                              </CardTitle>
                              <CardDescription className="text-gray-600">
                                Your OKX account details and verification status
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {userData.userInfo ? (
                            <div className="space-y-6">
                              {/* Display structured user info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">
                                      User ID
                                    </p>
                                    <p className="text-gray-900 font-mono text-sm mt-1">
                                      {userData.userInfo.userId ||
                                        userData.userInfo.uid ||
                                        "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">
                                      Nickname
                                    </p>
                                    <p className="text-gray-900 mt-1">
                                      {userData.userInfo.nickName || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">
                                      User Type
                                    </p>
                                    <div className="mt-1">
                                      <Badge
                                        className={
                                          userData.userInfo.userType ===
                                          "diamond"
                                            ? "bg-purple-50 text-purple-700 border-purple-200"
                                            : userData.userInfo.userType ===
                                              "gold"
                                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                            : "bg-gray-50 text-gray-700 border-gray-200"
                                        }
                                      >
                                        {userData.userInfo.userType || "N/A"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">
                                      Completed Orders
                                    </p>
                                    <p className="text-gray-900 mt-1 font-semibold">
                                      {userData.userInfo.completedOrders
                                        ? Number(
                                            userData.userInfo.completedOrders
                                          ).toLocaleString()
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">
                                      Completion Rate
                                    </p>
                                    <p className="text-gray-900 mt-1">
                                      {userData.userInfo.completionRate
                                        ? `${(
                                            Number(
                                              userData.userInfo.completionRate
                                            ) * 100
                                          ).toFixed(2)}%`
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">
                                      KYC Level
                                    </p>
                                    <div className="mt-1">
                                      <Badge
                                        className={
                                          userData.userInfo.kycLevel === "2" ||
                                          userData.userInfo.kycLv === "2"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : userData.userInfo.kycLevel ===
                                                "1" ||
                                              userData.userInfo.kycLv === "1"
                                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        }
                                      >
                                        Level{" "}
                                        {userData.userInfo.kycLevel ||
                                          userData.userInfo.kycLv ||
                                          "0"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Raw data for debugging */}
                              <details className="mt-6">
                                <summary className="text-gray-600 cursor-pointer text-sm font-medium">
                                  View Raw Data
                                </summary>
                                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                                  <pre className="text-gray-700 text-xs overflow-auto">
                                    {JSON.stringify(userData.userInfo, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                              <p className="text-gray-600">
                                No user information available
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="payments" className="space-y-4">
                      <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-gray-900">
                                Payment Methods
                              </CardTitle>
                              <CardDescription className="text-gray-600">
                                Your configured payment methods for P2P trading
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {userData.paymentMethods?.paymentMethods ? (
                            <div className="space-y-4">
                              {userData.paymentMethods.paymentMethods.map(
                                (method: any, index: number) => (
                                  <div
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                          <CreditCard className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900">
                                            {method.type ||
                                              method.paymentType ||
                                              "Unknown"}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {method.currency || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge
                                        className={
                                          method.status === "active" ||
                                          method.verified
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        }
                                      >
                                        {method.status ||
                                          (method.verified
                                            ? "Verified"
                                            : "Pending")}
                                      </Badge>
                                    </div>
                                    {method.accountName && (
                                      <p className="text-sm text-gray-600">
                                        Account: {method.accountName}
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                              <p className="text-gray-600 mb-1">
                                No payment methods configured
                              </p>
                              <p className="text-sm text-gray-500">
                                Configure payment methods in your OKX account
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}



