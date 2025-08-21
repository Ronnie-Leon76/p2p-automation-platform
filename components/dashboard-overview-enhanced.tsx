"use client";

import { DataRefreshControl } from "@/components/data-refresh-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExchangeData } from "@/hooks/use-exchange-data";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  BarChart3,
  Bot,
  DollarSign,
  Download,
  Eye,
  Plus,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

export function DashboardOverview() {
  const [isClient, setIsClient] = useState(false);

  // Use environment-appropriate auth
  const supabaseAuth = useSupabaseAuth();
  const mockAuth = isMockMode()
    ? useMockAuth()
    : { user: null, isAuthenticated: false, isLoading: false };

  // Select auth based on environment
  const { user, isAuthenticated, isLoading } = isMockMode()
    ? mockAuth
    : supabaseAuth;

  // Use the new exchange data hook
  const exchangeData = useExchangeData(user?.id || null, "okx", {
    autoRefresh: true, // Re-enabled with proper GET requests
    refreshInterval: 15, // 15 minutes for dashboard
    includeTypes: [
      "profile",
      "merchant_profile",
      "balance",
      "payment_methods",
      "orders",
    ],
    onRefreshStart: () => console.log("🔄 Dashboard data refresh started"),
    onRefreshComplete: () => console.log("✅ Dashboard data refresh completed"),
    onRefreshError: (error) =>
      console.error("❌ Dashboard data refresh failed:", error),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate dashboard metrics from exchange data
  const getDashboardMetrics = () => {
    const profile =
      exchangeData.merchantProfile?.data || exchangeData.profile?.data;
    const balance = exchangeData.balance?.data;
    const orders = exchangeData.orders?.data;

    console.log("🔍 Dashboard metrics debug:", {
      profile,
      balance,
      orders,
      merchantInfo30Day: profile?.merchantInfo30DayOrderInfo,
    });

    // Calculate total balance
    let totalBalance = 0;
    if (balance) {
      Object.values(balance).forEach((curr: any) => {
        if (curr?.availableAmount) {
          totalBalance += parseFloat(curr.availableAmount) || 0;
        }
      });
    }

    // Extract completion rate from available data
    const completionRate = profile
      ? parseFloat(profile.merchantInfo30DayOrderInfo?.completionRate30Day) ||
        parseFloat(profile.completionRate) ||
        // Use positive review percentage as completion rate proxy (since it's available)
        parseFloat(profile.positiveReviewPercentage) ||
        0
      : 0;

    // Extract completed orders from available data - use the actual available field!
    const completedOrders = profile
      ? parseInt(
          profile.merchantInfo30DayOrderInfo?.servedUsersCompletedOrders30Day
        ) ||
        parseInt(profile.completedBuyOrders) ||
        parseInt(profile.completedOrders) ||
        0
      : 0;

    const totalVolume = profile
      ? parseFloat(profile.commonOrderTotal) ||
        parseFloat(profile.totalOrderAmount) ||
        0
      : 0;

    const positiveRate = profile
      ? parseFloat(profile.positiveReviewPercentage) ||
        parseFloat(profile.positiveRate) ||
        0
      : 0;

    return {
      totalBalance,
      completionRate,
      completedOrders,
      totalVolume,
      positiveRate,
      activeOrders: orders?.orders?.length || 0,
      isVerified: profile?.isKycVerified || profile?.kycLevel === "2" || false,
    };
  };

  const metrics = getDashboardMetrics();

  // Show loading state
  if (!isClient || isLoading || exchangeData.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="space-y-8 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if no user is authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="flex items-center justify-center h-64">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-4">
                Please sign in to view your dashboard.
              </p>
              <Button
                onClick={() => (window.location.href = "/auth/login")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              P2P Trading Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's your trading overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
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
          className="mb-6"
        />

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                Available across currencies
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.completionRate.toFixed(1)}%
              </div>
              <Progress value={metrics.completionRate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.completedOrders.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <Activity className="mr-1 h-3 w-3 text-purple-600" />
                {metrics.activeOrders} active orders
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Positive Rate
              </CardTitle>
              <Shield className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.positiveRate.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 mt-2">
                {metrics.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Trading Performance
              </CardTitle>
              <CardDescription>
                Your recent trading statistics and trends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Volume</span>
                <span className="text-lg font-bold">
                  ${metrics.totalVolume.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed Orders</span>
                <span className="text-lg font-bold">
                  {metrics.completedOrders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {metrics.completionRate.toFixed(1)}%
                  </span>
                  <Badge
                    variant={
                      metrics.completionRate >= 95 ? "default" : "secondary"
                    }
                  >
                    {metrics.completionRate >= 95 ? "Excellent" : "Good"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Account Status
              </CardTitle>
              <CardDescription>
                Your account verification and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Type</span>
                <Badge variant={metrics.isVerified ? "default" : "secondary"}>
                  {metrics.isVerified ? "Verified Trader" : "Standard"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exchange</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟡 OKX</span>
                  <Badge variant="outline" className="text-xs">
                    Connected
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Updated</span>
                <span className="text-sm text-gray-500">
                  {exchangeData.lastRefresh
                    ? formatDistanceToNow(new Date(exchangeData.lastRefresh), {
                        addSuffix: true,
                      })
                    : "Never"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <a href="/dashboard/ads">
                  <Plus className="h-6 w-6" />
                  Create Ad
                </a>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <a href="/orders">
                  <Eye className="h-6 w-6" />
                  View Orders
                </a>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <a href="/analytics">
                  <BarChart3 className="h-6 w-6" />
                  Analytics
                </a>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <a href="/bots">
                  <Bot className="h-6 w-6" />
                  Trading Bots
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Balances */}
        {exchangeData.balance?.data && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Account Balances
              </CardTitle>
              <CardDescription>
                Your current balances across currencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
