"use client";

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
import { useMockAuth } from "@/hooks/use-mock-auth";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Clock,
  DollarSign,
  Download,
  Eye,
  Filter,
  PieChart,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Signal,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

export function DashboardOverview() {
  const { user, isAuthenticated } = useMockAuth();
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsDevelopment(process.env.NODE_ENV === "development");
  }, []);

  // Don't render until client-side hydration is complete
  if (!isClient) {
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor your P2P trading performance and system health
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* User Status Bar */}
        {isAuthenticated && user && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user.exchange_credentials?.exchange?.toUpperCase() ||
                        "Multi-Exchange"}{" "}
                      Trading Account
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <Signal className="w-3 h-3 mr-1.5" />
                    {user.provider === "mock" ? "Demo Mode" : "Live Trading"}
                  </Badge>
                  {isDevelopment && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      <Settings className="w-3 h-3 mr-1.5" />
                      Development
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Shield className="w-3 h-3 mr-1.5" />
                    Secured
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Volume */}
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Volume
                    </p>
                    <p className="text-xs text-gray-500">Last 24 hours</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">$847,392</p>
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-sm font-medium">+12.5%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Trades */}
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Trades
                    </p>
                    <p className="text-xs text-gray-500">Currently running</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">156</p>
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-sm font-medium">+8</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Success Rate
                    </p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">94.7%</p>
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-sm font-medium">+2.1%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Orders
                    </p>
                    <p className="text-xs text-gray-500">Awaiting execution</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">23</p>
                  <div className="flex items-center gap-1 text-orange-600">
                    <ArrowDownRight className="h-3 w-3" />
                    <span className="text-sm font-medium">-5</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Performance Chart */}
          <Card className="lg:col-span-2 border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Trading Performance
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Volume and profit trends over the last 30 days
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Performance Chart</p>
                  <p className="text-sm text-gray-500">
                    Chart visualization will be implemented here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-gray-600">
                Latest trades and system events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Trade Completed
                  </p>
                  <p className="text-xs text-gray-600">USDT/CNY - $2,450.00</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Price Updated
                  </p>
                  <p className="text-xs text-gray-600">Adjusted by algorithm</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    System Alert
                  </p>
                  <p className="text-xs text-gray-600">
                    Rate limit approaching
                  </p>
                  <p className="text-xs text-gray-500">12 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <div className="h-2 w-2 rounded-full bg-purple-500 mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    User Verified
                  </p>
                  <p className="text-xs text-gray-600">New trader approved</p>
                  <p className="text-xs text-gray-500">18 minutes ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exchange Status */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Exchange Connections
              </CardTitle>
              <CardDescription className="text-gray-600">
                Real-time status of exchange integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">OKX</p>
                    <p className="text-sm text-gray-600">Primary exchange</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    user?.exchange_credentials?.exchange === "okx"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }
                >
                  {user?.exchange_credentials?.exchange === "okx"
                    ? "Connected"
                    : "Disconnected"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Binance</p>
                    <p className="text-sm text-gray-600">Secondary exchange</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    user?.exchange_credentials?.exchange === "binance"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }
                >
                  {user?.exchange_credentials?.exchange === "binance"
                    ? "Connected"
                    : "Disconnected"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bybit</p>
                    <p className="text-sm text-gray-600">Tertiary exchange</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    user?.exchange_credentials?.exchange === "bybit"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }
                >
                  {user?.exchange_credentials?.exchange === "bybit"
                    ? "Connected"
                    : "Disconnected"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                System Health
              </CardTitle>
              <CardDescription className="text-gray-600">
                Automation services and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Price Bot
                  </span>
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
                <Progress value={95} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  95% efficiency - Excellent
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Order Bot
                  </span>
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
                <Progress value={87} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  87% efficiency - Good
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Monitor Bot
                  </span>
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Paused
                  </Badge>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  Temporarily disabled
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    API Health
                  </span>
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    Healthy
                  </Badge>
                </div>
                <Progress value={98} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">98.7% uptime today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Common tasks and operations for efficient management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
              >
                <PieChart className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Create Ad</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-green-50 hover:border-green-200"
              >
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Update Prices</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
              >
                <Eye className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">View Reports</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-orange-50 hover:border-orange-200"
              >
                <Users className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Manage Users</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
