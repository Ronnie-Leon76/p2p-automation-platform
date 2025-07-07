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
import {
  Activity,
  AlertCircle,
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Active Ads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">24</div>
            <p className="text-xs text-gray-400">+2 from last hour</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Pending Orders
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-xs text-gray-400">-3 from last hour</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Volume (24h)
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$45,231</div>
            <p className="text-xs text-gray-400">+12.5% from yesterday</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1,234</div>
            <p className="text-xs text-gray-400">+5.2% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-yellow-400" />
              Exchange Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">OKX</span>
              <Badge
                variant="default"
                className="bg-green-500/20 text-green-400 border-green-400/30"
              >
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Binance</span>
              <Badge
                variant="secondary"
                className="bg-gray-500/20 text-gray-400 border-gray-400/30"
              >
                Disconnected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Bybit</span>
              <Badge
                variant="secondary"
                className="bg-gray-500/20 text-gray-400 border-gray-400/30"
              >
                Disconnected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white">Automation Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Price Bot</span>
                <Badge
                  variant="default"
                  className="bg-green-500/20 text-green-400 border-green-400/30"
                >
                  Active
                </Badge>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Order Bot</span>
                <Badge
                  variant="default"
                  className="bg-green-500/20 text-green-400 border-green-400/30"
                >
                  Active
                </Badge>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Risk Monitor</span>
                <Badge
                  variant="default"
                  className="bg-green-500/20 text-green-400 border-green-400/30"
                >
                  Active
                </Badge>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="font-medium text-white">
                Price deviation detected
              </div>
              <div className="text-gray-400">USDT/CNY - 2 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-white">Order timeout</div>
              <div className="text-gray-400">Order #12345 - 5 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-white">New user blacklisted</div>
              <div className="text-gray-400">
                User ID: abc123 - 10 minutes ago
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Common tasks and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start bg-white/5 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/10 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
            >
              Create New Ad
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-white/5 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/10 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
            >
              Update Prices
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-white/5 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/10 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
            >
              View Orders
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-white/5 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/10 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
            >
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
