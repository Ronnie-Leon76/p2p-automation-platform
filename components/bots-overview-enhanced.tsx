"use client";

import { AppSidebar } from "@/components/app-sidebar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExchangeData } from "@/hooks/use-exchange-data";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  DollarSign,
  Eye,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Settings,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface TradingBot {
  id: string;
  name: string;
  type:
    | "arbitrage"
    | "market_maker"
    | "trend_follower"
    | "grid_trading"
    | "volume_monitor";
  status: "active" | "paused" | "stopped" | "error";
  exchange: string;
  currency_pair: string;
  profit_24h: number;
  profit_total: number;
  trades_24h: number;
  trades_total: number;
  created_at: string;
  last_activity: string;
  config: {
    min_amount: number;
    max_amount: number;
    profit_target: number;
    stop_loss: number;
    max_trades_per_hour: number;
  };
}

interface BotPerformance {
  timestamp: string;
  profit: number;
  trades: number;
  volume: number;
}

export default function BotsPage() {
  const [isClient, setIsClient] = useState(false);
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isCreateBotDialogOpen, setIsCreateBotDialogOpen] = useState(false);

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
    refreshInterval: 5, // 5 minutes for bots (frequent updates)
    includeTypes: ["balance", "orders", "merchant_profile"],
    onRefreshStart: () => console.log("🔄 Bots data refresh started"),
    onRefreshComplete: () => console.log("✅ Bots data refresh completed"),
    onRefreshError: (error) =>
      console.error("❌ Bots data refresh failed:", error),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate mock data when component loads
  useEffect(() => {
    if (isClient && isAuthenticated) {
      generateMockBotData();
    }
  }, [isClient, isAuthenticated]);

  const generateMockBotData = () => {
    const mockBots: TradingBot[] = [
      {
        id: "1",
        name: "USDT Arbitrage Pro",
        type: "arbitrage",
        status: "active",
        exchange: "OKX",
        currency_pair: "USDT/KES",
        profit_24h: 1250.5,
        profit_total: 18750.25,
        trades_24h: 12,
        trades_total: 487,
        created_at: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        last_activity: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        config: {
          min_amount: 1000,
          max_amount: 50000,
          profit_target: 2.5,
          stop_loss: 1.0,
          max_trades_per_hour: 3,
        },
      },
      {
        id: "2",
        name: "Grid Trading USDC",
        type: "grid_trading",
        status: "active",
        exchange: "OKX",
        currency_pair: "USDC/KES",
        profit_24h: 890.75,
        profit_total: 12450.8,
        trades_24h: 8,
        trades_total: 324,
        created_at: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
        last_activity: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        config: {
          min_amount: 500,
          max_amount: 25000,
          profit_target: 1.8,
          stop_loss: 0.8,
          max_trades_per_hour: 5,
        },
      },
      {
        id: "3",
        name: "Volume Monitor Bot",
        type: "volume_monitor",
        status: "paused",
        exchange: "OKX",
        currency_pair: "BTC/KES",
        profit_24h: 0,
        profit_total: 5670.9,
        trades_24h: 0,
        trades_total: 89,
        created_at: new Date(Date.now() - 1814400000).toISOString(), // 3 weeks ago
        last_activity: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        config: {
          min_amount: 5000,
          max_amount: 100000,
          profit_target: 3.0,
          stop_loss: 1.5,
          max_trades_per_hour: 2,
        },
      },
      {
        id: "4",
        name: "Market Maker USDT",
        type: "market_maker",
        status: "error",
        exchange: "OKX",
        currency_pair: "USDT/KES",
        profit_24h: -125.3,
        profit_total: 3280.45,
        trades_24h: 3,
        trades_total: 156,
        created_at: new Date(Date.now() - 2419200000).toISOString(), // 4 weeks ago
        last_activity: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        config: {
          min_amount: 2000,
          max_amount: 75000,
          profit_target: 2.0,
          stop_loss: 1.2,
          max_trades_per_hour: 4,
        },
      },
    ];

    setBots(mockBots);
  };

  const getBotStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case "stopped":
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Bot className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBotStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      active: "default",
      paused: "secondary",
      stopped: "outline",
      error: "destructive",
    };
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getBotTypeIcon = (type: string) => {
    switch (type) {
      case "arbitrage":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "market_maker":
        return <BarChart3 className="h-4 w-4 text-purple-600" />;
      case "trend_follower":
        return <Activity className="h-4 w-4 text-green-600" />;
      case "grid_trading":
        return <Zap className="h-4 w-4 text-orange-600" />;
      case "volume_monitor":
        return <Eye className="h-4 w-4 text-indigo-600" />;
      default:
        return <Bot className="h-4 w-4 text-gray-600" />;
    }
  };

  // Calculate aggregated metrics
  const calculateMetrics = () => {
    const activeBots = bots.filter((bot) => bot.status === "active").length;
    const totalProfitToday = bots.reduce((sum, bot) => sum + bot.profit_24h, 0);
    const totalProfitAll = bots.reduce((sum, bot) => sum + bot.profit_total, 0);
    const totalTradesToday = bots.reduce((sum, bot) => sum + bot.trades_24h, 0);
    const avgProfitPerTrade =
      totalTradesToday > 0 ? totalProfitToday / totalTradesToday : 0;

    return {
      activeBots,
      totalProfitToday,
      totalProfitAll,
      totalTradesToday,
      avgProfitPerTrade,
    };
  };

  const metrics = calculateMetrics();

  // Show loading state
  if (!isClient || isLoading || exchangeData.isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Trading Bots</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
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
              <Bot className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Trading Bots</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Authentication Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Please sign in to access your trading bots.
                </p>
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
            <Bot className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Trading Bots</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trading Bots</h1>
              <p className="text-gray-600 mt-1">
                Automate your P2P trading with intelligent bots
              </p>
            </div>
            <Button
              onClick={() => setIsCreateBotDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Bot
            </Button>
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

          {/* Bot Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Bots
                </CardTitle>
                <Bot className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeBots}</div>
                <p className="text-xs text-muted-foreground">
                  {bots.length - metrics.activeBots} inactive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Profit Today
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    metrics.totalProfitToday >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  KES {metrics.totalProfitToday.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalTradesToday} trades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Profit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  KES {metrics.totalProfitAll.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Per Trade
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  KES {metrics.avgProfitPerTrade.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Average profit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.5%</div>
                <p className="text-xs text-muted-foreground">
                  Profitable trades
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Account Balances from Exchange */}
          {exchangeData.balance?.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  Available Balance for Trading
                </CardTitle>
                <CardDescription>
                  Your current balances available for bot trading
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
                            <span className="text-gray-600">In Use:</span>
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

          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bots">Bot Management</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Active Bots Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Bots</CardTitle>
                  <CardDescription>
                    Currently running trading bots and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bots
                      .filter((bot) => bot.status === "active")
                      .map((bot) => (
                        <div
                          key={bot.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getBotTypeIcon(bot.type)}
                            <div>
                              <p className="font-medium">{bot.name}</p>
                              <p className="text-sm text-gray-600">
                                {bot.currency_pair} • {bot.exchange} • Last
                                active{" "}
                                {formatDistanceToNow(
                                  new Date(bot.last_activity),
                                  { addSuffix: true }
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-medium ${
                                bot.profit_24h >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {bot.profit_24h >= 0 ? "+" : ""}KES{" "}
                              {bot.profit_24h.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {bot.trades_24h} trades today
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bots" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Trading Bots</CardTitle>
                  <CardDescription>
                    Manage and configure your trading bots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>24h Profit</TableHead>
                        <TableHead>Total Profit</TableHead>
                        <TableHead>Trades</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bots.map((bot) => (
                        <TableRow key={bot.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getBotTypeIcon(bot.type)}
                              <div>
                                <p className="font-medium">{bot.name}</p>
                                <p className="text-sm text-gray-600">
                                  {bot.currency_pair}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {bot.type.replace("_", " ")}
                          </TableCell>
                          <TableCell>{getBotStatusBadge(bot.status)}</TableCell>
                          <TableCell
                            className={`font-medium ${
                              bot.profit_24h >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {bot.profit_24h >= 0 ? "+" : ""}KES{" "}
                            {bot.profit_24h.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            KES {bot.profit_total.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{bot.trades_24h} today</p>
                              <p className="text-gray-600">
                                {bot.trades_total} total
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Configure
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  {bot.status === "active" ? (
                                    <>
                                      <Pause className="mr-2 h-4 w-4" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="mr-2 h-4 w-4" />
                                      Start
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>
                    Detailed performance metrics for your trading bots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Performance Charts Coming Soon
                    </h3>
                    <p className="text-gray-600">
                      Detailed analytics and performance charts will be
                      available in the next update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Create Bot Dialog */}
          <Dialog
            open={isCreateBotDialogOpen}
            onOpenChange={setIsCreateBotDialogOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Trading Bot</DialogTitle>
                <DialogDescription>
                  Set up a new automated trading bot
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bot-name">Bot Name</Label>
                  <Input id="bot-name" placeholder="Enter bot name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bot-type">Bot Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bot type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arbitrage">Arbitrage</SelectItem>
                      <SelectItem value="market_maker">Market Maker</SelectItem>
                      <SelectItem value="grid_trading">Grid Trading</SelectItem>
                      <SelectItem value="volume_monitor">
                        Volume Monitor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency-pair">Currency Pair</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency pair" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT/KES">USDT/KES</SelectItem>
                      <SelectItem value="USDC/KES">USDC/KES</SelectItem>
                      <SelectItem value="BTC/KES">BTC/KES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsCreateBotDialogOpen(false)}>
                  Create Bot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

