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
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  MoreHorizontal,
  Plus,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// Mock payment data structures
interface PaymentMethod {
  id: string;
  type: "mpesa" | "bank" | "paypal" | "wise";
  name: string;
  details: string;
  isVerified: boolean;
  isEnabled: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "trade_payment" | "trade_receipt";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentMethod: string;
  counterparty?: string;
  orderId?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export function PaymentsOverview() {
  const [isClient, setIsClient] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isAddMethodDialogOpen, setIsAddMethodDialogOpen] = useState(false);

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
    autoRefresh: true,
    refreshInterval: 5, // 5 minutes for payments (more frequent)
    includeTypes: ["balance", "payment_methods", "orders"],
    onRefreshStart: () => console.log("🔄 Payments data refresh started"),
    onRefreshComplete: () => console.log("✅ Payments data refresh completed"),
    onRefreshError: (error) =>
      console.error("❌ Payments data refresh failed:", error),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate mock data when component loads
  useEffect(() => {
    if (isClient && isAuthenticated) {
      generateMockPaymentData();
    }
  }, [isClient, isAuthenticated]);

  const generateMockPaymentData = () => {
    // Generate mock payment methods
    const mockMethods: PaymentMethod[] = [
      {
        id: "1",
        type: "mpesa",
        name: "M-Pesa",
        details: "+254712345678",
        isVerified: true,
        isEnabled: true,
        createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      },
      {
        id: "2",
        type: "bank",
        name: "KCB Bank",
        details: "****1234",
        isVerified: true,
        isEnabled: true,
        createdAt: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
      },
      {
        id: "3",
        type: "wise",
        name: "Wise Transfer",
        details: "john.doe@email.com",
        isVerified: false,
        isEnabled: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
    ];

    // Generate mock transactions
    const mockTransactions: Transaction[] = [
      {
        id: "1",
        type: "trade_receipt",
        amount: 12500,
        currency: "KES",
        status: "completed",
        paymentMethod: "M-Pesa",
        counterparty: "user123",
        orderId: "ORD-001",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3000000).toISOString(),
        notes: "USDT purchase order",
      },
      {
        id: "2",
        type: "trade_payment",
        amount: 8900,
        currency: "KES",
        status: "pending",
        paymentMethod: "M-Pesa",
        counterparty: "user456",
        orderId: "ORD-002",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        notes: "USDT sale order",
      },
      {
        id: "3",
        type: "withdrawal",
        amount: 25000,
        currency: "KES",
        status: "completed",
        paymentMethod: "KCB Bank",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 85800000).toISOString(),
        notes: "Profit withdrawal",
      },
      {
        id: "4",
        type: "deposit",
        amount: 50000,
        currency: "KES",
        status: "completed",
        paymentMethod: "M-Pesa",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 172200000).toISOString(),
        notes: "Trading capital deposit",
      },
    ];

    setPaymentMethods(mockMethods);
    setTransactions(mockTransactions);
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending")
      return <Clock className="h-4 w-4 text-yellow-600" />;
    if (status === "failed" || status === "cancelled")
      return <X className="h-4 w-4 text-red-600" />;

    switch (type) {
      case "deposit":
      case "trade_receipt":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case "withdrawal":
      case "trade_payment":
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
      cancelled: "outline",
    };
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "mpesa":
        return <Smartphone className="h-4 w-4 text-green-600" />;
      case "bank":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "paypal":
      case "wise":
        return <Wallet className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  // Calculate metrics
  const calculateMetrics = () => {
    const totalReceived = transactions
      .filter(
        (t) =>
          ["deposit", "trade_receipt"].includes(t.type) &&
          t.status === "completed"
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSent = transactions
      .filter(
        (t) =>
          ["withdrawal", "trade_payment"].includes(t.type) &&
          t.status === "completed"
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingTransactions = transactions.filter(
      (t) => t.status === "pending"
    ).length;
    const activePaymentMethods = paymentMethods.filter(
      (pm) => pm.isEnabled
    ).length;

    return {
      totalReceived,
      totalSent,
      netFlow: totalReceived - totalSent,
      pendingTransactions,
      activePaymentMethods,
    };
  };

  const metrics = calculateMetrics();

  // Show loading state
  if (!isClient || isLoading || exchangeData.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
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
    );
  }

  // Show login prompt if no user is authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please sign in to view your payments.
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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Manage your payment methods and transaction history
          </p>
        </div>
        <Button
          onClick={() => setIsAddMethodDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Payment Method
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Received
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {metrics.totalReceived.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From trades and deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              KES {metrics.totalSent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Trades and withdrawals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                metrics.netFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              KES {metrics.netFlow.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Net money flow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.pendingTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending transactions
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
              Exchange Balances
            </CardTitle>
            <CardDescription>
              Your current balances on the exchange
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

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest payment activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type, transaction.status)}
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.type
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-600">
                          {transaction.paymentMethod} •{" "}
                          {formatDistanceToNow(
                            new Date(transaction.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          ["deposit", "trade_receipt"].includes(
                            transaction.type
                          )
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {["deposit", "trade_receipt"].includes(transaction.type)
                          ? "+"
                          : "-"}
                        {transaction.currency}{" "}
                        {transaction.amount.toLocaleString()}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your configured payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getPaymentMethodIcon(method.type)}
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-gray-600">
                          {method.details}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge
                        variant={method.isEnabled ? "default" : "outline"}
                        className="text-xs"
                      >
                        {method.isEnabled ? "Active" : "Disabled"}
                      </Badge>
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
                            {method.isEnabled ? "Disable" : "Enable"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Complete history of your payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(
                            transaction.type,
                            transaction.status
                          )}
                          <span className="capitalize">
                            {transaction.type.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          ["deposit", "trade_receipt"].includes(
                            transaction.type
                          )
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {["deposit", "trade_receipt"].includes(transaction.type)
                          ? "+"
                          : "-"}
                        {transaction.currency}{" "}
                        {transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(transaction.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
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
      </Tabs>

      {/* Add Payment Method Dialog */}
      <Dialog
        open={isAddMethodDialogOpen}
        onOpenChange={setIsAddMethodDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method to your account
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="method-type">Payment Method Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="wise">Wise Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="method-details">Details</Label>
              <Input id="method-details" placeholder="Enter account details" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAddMethodDialogOpen(false)}>
              Add Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
