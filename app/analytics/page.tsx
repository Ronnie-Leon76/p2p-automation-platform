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
import {
  Activity,
  BarChart3,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

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
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Profit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,428.50</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  +18.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.4%</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Trades
                </CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  -5.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Volume 24h
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$89,420</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  +25.8% from yesterday
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Exchange Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Exchange Performance</CardTitle>
                <CardDescription>
                  Trading performance by exchange platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    name: "Binance",
                    profit: "$4,250.30",
                    percentage: 68,
                    change: "+12.5%",
                  },
                  {
                    name: "OKX",
                    profit: "$3,180.20",
                    percentage: 52,
                    change: "+8.2%",
                  },
                  {
                    name: "Bybit",
                    profit: "$2,890.40",
                    percentage: 45,
                    change: "+15.1%",
                  },
                  {
                    name: "KuCoin",
                    profit: "$2,107.60",
                    percentage: 38,
                    change: "+6.8%",
                  },
                ].map((exchange) => (
                  <div key={exchange.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{exchange.name}</span>
                        <Badge variant="outline" className="text-green-600">
                          {exchange.change}
                        </Badge>
                      </div>
                      <span className="font-medium">{exchange.profit}</span>
                    </div>
                    <Progress value={exchange.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Trading Strategies */}
            <Card>
              <CardHeader>
                <CardTitle>Strategy Analysis</CardTitle>
                <CardDescription>
                  Performance breakdown by trading strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    name: "Arbitrage",
                    trades: 324,
                    profit: "$5,420.10",
                    winRate: "82.1%",
                  },
                  {
                    name: "Grid Trading",
                    trades: 156,
                    profit: "$3,280.50",
                    winRate: "76.3%",
                  },
                  {
                    name: "DCA Strategy",
                    trades: 89,
                    profit: "$2,190.80",
                    winRate: "68.5%",
                  },
                  {
                    name: "Market Making",
                    trades: 234,
                    profit: "$1,537.10",
                    winRate: "74.8%",
                  },
                ].map((strategy, index) => (
                  <div
                    key={strategy.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? "bg-blue-500"
                            : index === 1
                            ? "bg-green-500"
                            : index === 2
                            ? "bg-yellow-500"
                            : "bg-purple-500"
                        }`}
                      />
                      <div>
                        <div className="font-medium">{strategy.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {strategy.trades} trades
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{strategy.profit}</div>
                      <div className="text-sm text-green-600">
                        {strategy.winRate}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Risk Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
              <CardDescription>
                Portfolio risk analysis and exposure levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Max Drawdown</span>
                    <span className="text-sm text-red-600">-8.2%</span>
                  </div>
                  <Progress value={18} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className="text-sm text-yellow-600">Medium</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Exposure</span>
                    <span className="text-sm text-blue-600">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
