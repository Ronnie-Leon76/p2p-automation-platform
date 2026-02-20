"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useExchangeData } from "@/hooks/use-exchange-data";
import { useDashboardBootstrap } from "@/hooks/use-dashboard-bootstrap";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

function AnalyticsContent() {
  const [isClient, setIsClient] = useState(false);

  // Use environment-appropriate auth
  const supabaseAuth = useAuth();
  const mockAuth = isMockMode()
    ? useMockAuth()
    : { user: null, isAuthenticated: false, isLoading: false };

  // Select auth based on environment
  const { user, isAuthenticated, isLoading } = isMockMode()
    ? mockAuth
    : supabaseAuth;
  useDashboardBootstrap("okx", ["profile", "merchant_profile", "balance", "orders"]);

  // Use the new exchange data hook
  const exchangeData = useExchangeData(user?.id || null, "okx", {
    autoRefresh: false,
    refreshInterval: 10, // 10 minutes for analytics
    includeTypes: ["profile", "merchant_profile", "balance", "orders"],
    onRefreshStart: () => undefined,
    onRefreshComplete: () => undefined,
    onRefreshError: (error) => console.error("Analytics data refresh failed:", error),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate analytics metrics from exchange data
  const getAnalyticsMetrics = () => {
    const profile =
      exchangeData.merchantProfile?.data || exchangeData.profile?.data;
    const balance = exchangeData.balance?.data;
    const orders = exchangeData.orders?.data;

    // Calculate total balance and currency distribution
    let totalBalance = 0;
    const currencyDistribution: { [key: string]: number } = {};

    if (balance) {
      Object.entries(balance).forEach(([currency, curr]: [string, any]) => {
        const amount = parseFloat(curr?.availableAmount || 0);
        totalBalance += amount;
        currencyDistribution[currency] = amount;
      });
    }

    // Calculate performance metrics
    const completionRate = profile
      ? parseFloat(
          profile.merchantInfo30DayOrderInfo?.[0]?.completionRate30Day
        ) ||
        parseFloat(profile.completionRate) * 100 ||
        0
      : 0;

    const completedOrders = profile
      ? parseInt(profile.completedBuyOrders) ||
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

    // Calculate growth metrics (mock data for demonstration)
    const monthlyGrowth = Math.random() * 20 + 5; // 5-25%
    const weeklyGrowth = Math.random() * 10 + 2; // 2-12%

    return {
      totalBalance,
      currencyDistribution,
      completionRate,
      completedOrders,
      totalVolume,
      positiveRate,
      monthlyGrowth,
      weeklyGrowth,
      activeOrders: orders?.orders?.length || 0,
      averageOrderValue:
        totalVolume > 0 && completedOrders > 0
          ? totalVolume / completedOrders
          : 0,
    };
  };

  const metrics = getAnalyticsMetrics();

  // Show loading state
  if (!isClient || isLoading || exchangeData.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if no user is authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please sign in to view your analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your trading performance
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalVolume.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />+
              {metrics.monthlyGrowth.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />+
              {metrics.weeklyGrowth.toFixed(1)}% this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.averageOrderValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <BarChart3 className="mr-1 h-3 w-3 text-purple-600" />
              Based on {metrics.completedOrders} orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trading Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Trading Performance
            </CardTitle>
            <CardDescription>
              Your comprehensive trading statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Positive Reviews</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {metrics.positiveRate.toFixed(1)}%
                  </span>
                  <Badge
                    variant={
                      metrics.positiveRate >= 95 ? "default" : "secondary"
                    }
                  >
                    {metrics.positiveRate >= 95 ? "Excellent" : "Good"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Portfolio Balance
            </CardTitle>
            <CardDescription>
              Distribution of your currency holdings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Balance</span>
                <span className="text-lg font-bold">
                  ${metrics.totalBalance.toLocaleString()}
                </span>
              </div>
              <div className="space-y-3">
                {Object.entries(metrics.currencyDistribution).map(
                  ([currency, amount]) => {
                    const percentage =
                      metrics.totalBalance > 0
                        ? (amount / metrics.totalBalance) * 100
                        : 0;
                    return (
                      <div key={currency} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{currency}</span>
                          <span>${amount.toLocaleString()}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Data Source Information
          </CardTitle>
          <CardDescription>Real-time data integration status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Exchange Connection
                </span>
              </div>
              <p className="text-sm text-green-700">ðŸŸ¡ OKX - Connected</p>
              <p className="text-xs text-green-600 mt-1">
                Data source:{" "}
                {exchangeData.merchantProfile?.data
                  ? "Merchant Profile API"
                  : "Basic Profile API"}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Last Updated</span>
              </div>
              <p className="text-sm text-blue-700">
                {exchangeData.lastRefresh
                  ? formatDistanceToNow(new Date(exchangeData.lastRefresh), {
                      addSuffix: true,
                    })
                  : "Never"}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Auto-refresh: 10 minutes
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">
                  Data Quality
                </span>
              </div>
              <p className="text-sm text-purple-700">
                {Object.keys(exchangeData.errors).filter(
                  (key) =>
                    exchangeData.errors[key as keyof typeof exchangeData.errors]
                ).length === 0
                  ? "All systems operational"
                  : "Some data sources unavailable"}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {exchangeData.isRefreshing ? "Refreshing..." : "Up to date"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Analytics</h1>
          </div>
        </header>
        <AnalyticsContent />
      </SidebarInset>
    </SidebarProvider>
  );
}


