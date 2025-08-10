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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  PlusCircle,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

export function PaymentsOverview() {
  // Mock payment data
  const paymentStats = [
    {
      title: "Total Volume",
      value: "$45,231.89",
      change: "+20.1%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Active Payments",
      value: "23",
      change: "+4",
      icon: CreditCard,
      trend: "up",
    },
    {
      title: "Success Rate",
      value: "98.2%",
      change: "+2.1%",
      icon: TrendingUp,
      trend: "up",
    },
    {
      title: "Avg. Processing",
      value: "2.4 min",
      change: "-0.3 min",
      icon: Receipt,
      trend: "down",
    },
  ];

  const recentPayments = [
    {
      id: "PAY-001",
      type: "deposit",
      amount: "$1,234.56",
      status: "completed",
      method: "M-Pesa",
      timestamp: "2 min ago",
    },
    {
      id: "PAY-002",
      type: "withdrawal",
      amount: "$567.89",
      status: "pending",
      method: "Bank Transfer",
      timestamp: "5 min ago",
    },
    {
      id: "PAY-003",
      type: "deposit",
      amount: "$890.12",
      status: "completed",
      method: "M-Pesa",
      timestamp: "12 min ago",
    },
    {
      id: "PAY-004",
      type: "withdrawal",
      amount: "$345.67",
      status: "failed",
      method: "Bank Transfer",
      timestamp: "1 hour ago",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {paymentStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-gray-200/50 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="methods">Methods</TabsTrigger>
          </TabsList>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Payment
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card className="border-gray-200/50 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Recent Payments</CardTitle>
                <CardDescription className="text-gray-500">
                  Latest payment activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPayments.slice(0, 4).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            payment.type === "deposit"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.id}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {payment.amount}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-gray-200/50 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Payment Methods</CardTitle>
                <CardDescription className="text-gray-500">
                  Connected payment providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">M-Pesa</p>
                        <p className="text-sm text-gray-500">Mobile Money</p>
                      </div>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Bank Transfer
                        </p>
                        <p className="text-sm text-gray-500">Direct Banking</p>
                      </div>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="border-gray-200/50 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">All Transactions</CardTitle>
              <CardDescription className="text-gray-500">
                Complete payment transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.amount}
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-gray-500">
                        {payment.timestamp}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card className="border-gray-200/50 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Payment Method Configuration
              </CardTitle>
              <CardDescription className="text-gray-500">
                Manage your payment providers and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Wallet className="h-6 w-6 text-green-600" />
                        <div>
                          <CardTitle className="text-lg">
                            M-Pesa Integration
                          </CardTitle>
                          <CardDescription>
                            Mobile money payments
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Success Rate:</span>
                          <span className="font-medium">99.1%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Avg. Processing:
                          </span>
                          <span className="font-medium">1.2 min</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                      >
                        Configure
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">
                            Bank Transfer
                          </CardTitle>
                          <CardDescription>
                            Direct bank payments
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Success Rate:</span>
                          <span className="font-medium">97.8%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Avg. Processing:
                          </span>
                          <span className="font-medium">3.1 min</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                      >
                        Configure
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
