import { AppSidebar } from "@/components/app-sidebar";
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
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Pause,
  Play,
  Plus,
  Settings,
  TrendingUp,
} from "lucide-react";

export default function BotsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Trading Bots</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Bot Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Bots
                </CardTitle>
                <Bot className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Profit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$15,234.50</div>
                <p className="text-xs text-muted-foreground">
                  +18.2% this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">84.2%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  2 warnings, 1 error
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Create New Bot */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trading Bots</CardTitle>
                  <CardDescription>
                    Manage your automated trading strategies
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Bot
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Active Bots */}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                name: "Arbitrage Bot Alpha",
                strategy: "Cross-Exchange Arbitrage",
                status: "running",
                profit: "+$2,450.30",
                trades: 156,
                uptime: "99.2%",
                exchange: "Binance ↔ OKX",
              },
              {
                name: "Grid Master Pro",
                strategy: "Grid Trading",
                status: "running",
                profit: "+$1,890.75",
                trades: 89,
                uptime: "97.8%",
                exchange: "Bybit",
              },
              {
                name: "DCA Strategy Bot",
                strategy: "Dollar Cost Averaging",
                status: "paused",
                profit: "+$3,120.40",
                trades: 234,
                uptime: "95.5%",
                exchange: "Binance",
              },
              {
                name: "Market Maker V2",
                strategy: "Market Making",
                status: "error",
                profit: "+$890.20",
                trades: 67,
                uptime: "88.3%",
                exchange: "OKX",
              },
              {
                name: "Trend Follower",
                strategy: "Momentum Trading",
                status: "running",
                profit: "+$1,567.85",
                trades: 123,
                uptime: "96.7%",
                exchange: "Bybit",
              },
              {
                name: "Scalping Bot Elite",
                strategy: "High-Frequency Trading",
                status: "running",
                profit: "+$4,315.00",
                trades: 445,
                uptime: "98.9%",
                exchange: "Binance",
              },
            ].map((bot) => (
              <Card key={bot.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-base">{bot.name}</CardTitle>
                        <CardDescription>{bot.strategy}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          bot.status === "running"
                            ? "default"
                            : bot.status === "paused"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {bot.status}
                      </Badge>
                      <Switch
                        checked={bot.status === "running"}
                        disabled={bot.status === "error"}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Profit</div>
                      <div className="font-medium text-green-600">
                        {bot.profit}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Trades</div>
                      <div className="font-medium">{bot.trades}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div className="font-medium">{bot.uptime}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Exchange</div>
                      <div className="font-medium">{bot.exchange}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button
                      variant={bot.status === "running" ? "outline" : "default"}
                      size="sm"
                      disabled={bot.status === "error"}
                    >
                      {bot.status === "running" ? (
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
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
