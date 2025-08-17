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
import { Switch } from "@/components/ui/switch";
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
  SASAPAY_LIMITS,
  getSasaPayOrderLimits,
  validateB2CTransaction,
} from "@/lib/payments/sasapay-limits";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  CreditCard,
  DollarSign,
  Edit,
  Eye,
  MoreVertical,
  PlusCircle,
  Receipt,
  Settings,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

export function PaymentsOverview() {
  // Modal state management
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [isApiConfigDialogOpen, setIsApiConfigDialogOpen] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [actionType, setActionType] = useState("");

  // Form state management
  const [sasaPayConfig, setSasaPayConfig] = useState({
    merchantCode: "SP_DEMO_3456",
    environment: "sandbox",
    clientId: "",
    clientSecret: "",
    webhookUrl: "https://your-domain.com/api/webhooks/sasapay",
    isActive: true,
    dailyLimit: SASAPAY_LIMITS.DAILY_LIMIT as number, // Daily limit for B2C transactions
    maxSingleTransaction: SASAPAY_LIMITS.MAX_SINGLE_TRANSACTION as number, // Maximum single B2C transaction
    // Updated fee structure based on actual SasaPay pricing
    c2bFeePercent: SASAPAY_LIMITS.C2B_FEE_PERCENT as number, // C2B (receiving) 0.2% charged on business
    c2bFeeCap: SASAPAY_LIMITS.C2B_FEE_CAP as number, // C2B fee capped at 150 KES
    b2cFeeTable: true, // B2C uses tiered fee table
    autoSettle: true,
    // Daily usage tracking
    dailyUsageTracking: {
      date: new Date().toISOString().split("T")[0],
      totalSent: 0,
      transactionCount: 0,
      remainingLimit: SASAPAY_LIMITS.DAILY_LIMIT as number,
    },
  });

  const [mpesaConfig, setMpesaConfig] = useState({
    consumerKey: "",
    consumerSecret: "",
    environment: "sandbox",
    shortcode: "",
    passkey: "",
    webhookUrl: "https://your-domain.com/api/webhooks/mpesa",
    isActive: false,
  });

  const [bankConfig, setBankConfig] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    swiftCode: "",
    routingNumber: "",
    isActive: false,
  });

  // Validate SasaPay B2C transaction limits using shared utility
  const validateB2CTransactionLocal = (
    amount: number
  ): {
    isValid: boolean;
    reason?: string;
    maxAllowed?: number;
  } => {
    const today = new Date().toISOString().split("T")[0];
    const usage = sasaPayConfig.dailyUsageTracking;

    // Reset tracking if it's a new day
    if (usage.date !== today) {
      usage.date = today;
      usage.totalSent = 0;
      usage.transactionCount = 0;
      usage.remainingLimit = sasaPayConfig.dailyLimit;
    }

    return validateB2CTransaction(amount, usage.totalSent);
  };

  // Update daily usage tracking
  const updateDailyUsage = (amount: number) => {
    const today = new Date().toISOString().split("T")[0];
    const usage = sasaPayConfig.dailyUsageTracking;

    if (usage.date !== today) {
      usage.date = today;
      usage.totalSent = 0;
      usage.transactionCount = 0;
    }

    setSasaPayConfig((prev) => ({
      ...prev,
      dailyUsageTracking: {
        ...usage,
        totalSent: usage.totalSent + amount,
        transactionCount: usage.transactionCount + 1,
        remainingLimit: prev.dailyLimit - (usage.totalSent + amount),
      },
    }));
  };

  // Get recommended buy ad limits for SasaPay using shared utility
  const getSasaPayBuyAdLimitsLocal = () => {
    const usage = sasaPayConfig.dailyUsageTracking;
    return getSasaPayOrderLimits(usage.totalSent);
  };

  // Handle modal actions
  const handleConfigure = (method: string, action: string) => {
    setSelectedPaymentMethod(method);
    setActionType(action);

    switch (action) {
      case "configure":
        setIsConfigureDialogOpen(true);
        break;
      case "settings":
        setIsSettingsDialogOpen(true);
        break;
      case "analytics":
        setIsAnalyticsDialogOpen(true);
        break;
      case "api":
        setIsApiConfigDialogOpen(true);
        break;
      case "webhook":
        setIsWebhookDialogOpen(true);
        break;
      case "delete":
        setIsDeleteConfirmOpen(true);
        break;
    }
  };

  // SasaPay-focused payment statistics
  const paymentStats = [
    {
      title: "Total Volume (KES)",
      value: "KES 2,847,650",
      change: "+15.3%",
      icon: DollarSign,
      trend: "up",
      description: "Total SasaPay transactions this month",
    },
    {
      title: "Active P2P Orders",
      value: "47",
      change: "+12",
      icon: CreditCard,
      trend: "up",
      description: "Currently processing P2P orders",
    },
    {
      title: "SasaPay Success Rate",
      value: "99.1%",
      change: "+0.8%",
      icon: TrendingUp,
      trend: "up",
      description: "C2B and B2C transaction success",
    },
    {
      title: "Avg. Processing",
      value: "1.2 min",
      change: "-0.4 min",
      icon: Receipt,
      trend: "down",
      description: "Average SasaPay settlement time",
    },
  ];

  // SasaPay-focused recent transactions
  const recentPayments = [
    {
      id: "SP-P2P-001",
      type: "c2b_receive",
      amount: "KES 3,500",
      status: "completed",
      method: "SasaPay C2B",
      phone: "254708374149",
      orderId: "ORD-ETH-001",
      timestamp: "2 min ago",
      sasapayRef: "SP230812001",
    },
    {
      id: "SP-P2P-002",
      type: "b2c_send",
      amount: "KES 12,750",
      status: "pending",
      method: "SasaPay B2C",
      phone: "254712345678",
      orderId: "ORD-BTC-002",
      timestamp: "5 min ago",
      sasapayRef: "SP230812002",
    },
    {
      id: "SP-P2P-003",
      type: "c2b_receive",
      amount: "KES 8,900",
      status: "completed",
      method: "SasaPay C2B",
      phone: "254701234567",
      orderId: "ORD-USDT-003",
      timestamp: "12 min ago",
      sasapayRef: "SP230812003",
    },
    {
      id: "SP-P2P-004",
      type: "b2c_send",
      amount: "KES 5,250",
      status: "failed",
      method: "SasaPay B2C",
      phone: "254723456789",
      orderId: "ORD-ETH-004",
      timestamp: "1 hour ago",
      sasapayRef: "SP230812004",
      errorReason: "Insufficient funds",
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "c2b_receive":
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case "b2c_send":
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "c2b_receive":
        return "Payment Received";
      case "b2c_send":
        return "Payment Sent";
      default:
        return type;
    }
  };

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

      {/* SasaPay Expense Tracking */}
      <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-orange-900 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                SasaPay Transaction Costs
              </CardTitle>
              <CardDescription className="text-orange-700">
                Track fees and their impact on P2P trading profitability
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfigure("sasapay", "analytics")}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View PNL
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                KES 1,240
              </div>
              <div className="text-sm text-orange-700">
                Total Fees (30 days)
              </div>
              <div className="text-xs text-orange-600 mt-1">
                18 B2C + 6 C2B transactions
              </div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">KES 350</div>
              <div className="text-sm text-blue-700">C2B Fees</div>
              <div className="text-xs text-blue-600 mt-1">
                0.2% (max KES 150)
              </div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">KES 890</div>
              <div className="text-sm text-red-700">B2C Fees</div>
              <div className="text-xs text-red-600 mt-1">Tiered structure</div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">0.9%</div>
              <div className="text-sm text-purple-700">Fee Impact on PNL</div>
              <div className="text-xs text-purple-600 mt-1">
                Moderate cost structure
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Fee Type Breakdown
              </span>
              <span className="text-xs text-gray-500">Last 30 days</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  C2B (Receiving money)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600">
                    KES 350
                  </span>
                  <Badge variant="outline" className="text-xs">
                    6 transactions
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  B2C (Sending money)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-600">
                    KES 890
                  </span>
                  <Badge variant="outline" className="text-xs">
                    18 transactions
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(payment.type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">
                              {payment.id}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {getTransactionTypeLabel(payment.type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {payment.phone} • {payment.timestamp}
                          </p>
                          <p className="text-xs text-blue-600">
                            Order: {payment.orderId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {payment.amount}
                        </p>
                        {getStatusBadge(payment.status)}
                        <p className="text-xs text-gray-500 mt-1">
                          Ref: {payment.sasapayRef}
                        </p>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* SasaPay Configuration - Primary Method */}
                  <Card className="border-2 border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-1 bg-blue-600 rounded">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-lg text-blue-900">
                              SasaPay
                            </CardTitle>
                            <Badge className="bg-blue-600 text-white text-xs">
                              Primary
                            </Badge>
                          </div>
                          <CardDescription className="text-blue-700">
                            Fast & secure instant payments
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Success Rate:</span>
                          <span className="font-medium text-green-600">
                            99.8%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Avg. Processing:
                          </span>
                          <span className="font-medium text-blue-600">
                            15 sec
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Daily Limit:</span>
                          <span className="font-medium">KES 500,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Max Single:</span>
                          <span className="font-medium text-orange-600">
                            KES 150,000
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">C2B Fee:</span>
                          <span className="font-medium text-orange-600">
                            0.2% (max KES 150)
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">B2C Fee:</span>
                          <span className="font-medium">Tiered (KES 0-39)</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                          onClick={() =>
                            handleConfigure("sasapay", "configure")
                          }
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              SasaPay Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleConfigure("sasapay", "settings")
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleConfigure("sasapay", "api")}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              API Configuration
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleConfigure("sasapay", "analytics")
                              }
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                handleConfigure("sasapay", "delete")
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Disable Integration
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>

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
                          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Secondary
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
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleConfigure("mpesa", "configure")}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              M-Pesa Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleConfigure("mpesa", "settings")
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleConfigure("mpesa", "api")}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Connection Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleConfigure("mpesa", "analytics")
                              }
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              View Performance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleConfigure("mpesa", "delete")}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Integration
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Secondary
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
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleConfigure("bank", "configure")}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              Bank Transfer Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleConfigure("bank", "settings")
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Bank Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleConfigure("bank", "api")}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Transfer Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleConfigure("bank", "analytics")
                              }
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              View Reports
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleConfigure("bank", "delete")}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Method
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* SasaPay Configuration Details */}
                <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      <div className="p-1 bg-blue-600 rounded">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      SasaPay Integration Settings
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Configure your SasaPay integration for optimal P2P trading
                      performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">
                            API Configuration
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Environment
                                </span>
                                <p className="text-xs text-gray-500">
                                  Current API endpoint
                                </p>
                              </div>
                              <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                                Sandbox
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Merchant Code
                                </span>
                                <p className="text-xs text-gray-500">
                                  Your SasaPay merchant ID
                                </p>
                              </div>
                              <span className="text-sm font-mono text-gray-600">
                                SP_****3456
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Webhook Status
                                </span>
                                <p className="text-xs text-gray-500">
                                  Real-time notifications
                                </p>
                              </div>
                              <Badge className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">
                            Transaction Limits
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  C2B Limit
                                </span>
                                <p className="text-xs text-gray-500">
                                  Customer to Business
                                </p>
                              </div>
                              <span className="text-sm font-medium text-blue-600">
                                KES 100,000
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  B2C Limit
                                </span>
                                <p className="text-xs text-gray-500">
                                  Business to Customer
                                </p>
                              </div>
                              <span className="text-sm font-medium text-blue-600">
                                KES 70,000
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  C2B Fee Structure
                                </span>
                                <p className="text-xs text-gray-500">
                                  Customer to Business (Receiving)
                                </p>
                              </div>
                              <span className="text-sm font-medium text-orange-600">
                                0.2% (Max: KES 150)
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  B2C Fee Structure
                                </span>
                                <p className="text-xs text-gray-500">
                                  Business to Customer (Sending)
                                </p>
                              </div>
                              <span className="text-sm font-medium text-blue-600">
                                Tiered: KES 0-39
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <div className="p-1 bg-blue-600 rounded">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-blue-900">
                            Performance Optimization
                          </h5>
                          <p className="text-sm text-blue-700 mt-1">
                            SasaPay is optimized for high-frequency P2P trading
                            with instant settlement and automated
                            reconciliation.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() =>
                                handleConfigure("sasapay", "analytics")
                              }
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              View Analytics
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-700"
                              onClick={() => handleConfigure("sasapay", "api")}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Test Connection
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-300 text-blue-700"
                                >
                                  <MoreVertical className="h-4 w-4 mr-2" />
                                  More Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                  Advanced Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleConfigure("sasapay", "api")
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit API Keys
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleConfigure("sasapay", "webhook")
                                  }
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Webhook Configuration
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleConfigure("sasapay", "analytics")
                                  }
                                >
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Transaction Logs
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleConfigure("sasapay", "analytics")
                                  }
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Performance Reports
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    handleConfigure("sasapay", "delete")
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Reset Configuration
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Daily Usage Tracking Section */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          Daily B2C Usage Tracking
                        </h4>
                        <Badge
                          variant="outline"
                          className={`${
                            sasaPayConfig.dailyUsageTracking.remainingLimit <
                            100000
                              ? "border-red-300 text-red-700"
                              : "border-green-300 text-green-700"
                          }`}
                        >
                          {sasaPayConfig.dailyUsageTracking.transactionCount}{" "}
                          transactions today
                        </Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-blue-600">
                            KES{" "}
                            {sasaPayConfig.dailyUsageTracking.totalSent.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Sent Today
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {(
                              (sasaPayConfig.dailyUsageTracking.totalSent /
                                sasaPayConfig.dailyLimit) *
                              100
                            ).toFixed(1)}
                            % of daily limit
                          </div>
                        </div>

                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-green-600">
                            KES{" "}
                            {sasaPayConfig.dailyUsageTracking.remainingLimit.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Remaining Today
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Available for new orders
                          </div>
                        </div>

                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-orange-600">
                            KES{" "}
                            {Math.min(
                              sasaPayConfig.maxSingleTransaction,
                              sasaPayConfig.dailyUsageTracking.remainingLimit
                            ).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Max Next Order
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {sasaPayConfig.dailyUsageTracking.remainingLimit <
                            sasaPayConfig.maxSingleTransaction
                              ? "Limited by daily cap"
                              : "Limited by single transaction"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start space-x-2">
                          <div className="p-1 bg-amber-500 rounded">
                            <TrendingUp className="h-3 w-3 text-white" />
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-amber-800 mb-1">
                              Buy Ad Recommendations:
                            </p>
                            <p className="text-amber-700">
                              • Set max order size to{" "}
                              <strong>
                                KES{" "}
                                {Math.min(
                                  sasaPayConfig.maxSingleTransaction,
                                  sasaPayConfig.dailyUsageTracking
                                    .remainingLimit
                                ).toLocaleString()}
                              </strong>{" "}
                              to avoid payment failures
                            </p>
                            <p className="text-amber-700">
                              • Monitor daily usage to prevent exceeding KES
                              500,000 limit
                            </p>
                            {sasaPayConfig.dailyUsageTracking.remainingLimit <
                              50000 && (
                              <p className="text-red-700 font-medium">
                                ⚠️ Low daily limit remaining - consider pausing
                                buy ads until tomorrow
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Modal - Main Configure Dialog */}
      <Dialog
        open={isConfigureDialogOpen}
        onOpenChange={setIsConfigureDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Configure{" "}
              {selectedPaymentMethod === "sasapay"
                ? "SasaPay"
                : selectedPaymentMethod === "mpesa"
                ? "M-Pesa"
                : "Bank Transfer"}
            </DialogTitle>
            <DialogDescription>
              Set up and configure your payment method integration
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {selectedPaymentMethod === "sasapay" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="environment">Environment</Label>
                      <Select
                        value={sasaPayConfig.environment}
                        onValueChange={(value) =>
                          setSasaPayConfig({
                            ...sasaPayConfig,
                            environment: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">Sandbox</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="merchantCode">Merchant Code</Label>
                      <Input
                        id="merchantCode"
                        value={sasaPayConfig.merchantCode}
                        onChange={(e) =>
                          setSasaPayConfig({
                            ...sasaPayConfig,
                            merchantCode: e.target.value,
                          })
                        }
                        placeholder="SP_DEMO_3456"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        type="password"
                        value={sasaPayConfig.clientId}
                        onChange={(e) =>
                          setSasaPayConfig({
                            ...sasaPayConfig,
                            clientId: e.target.value,
                          })
                        }
                        placeholder="Enter your Client ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientSecret">Client Secret</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={sasaPayConfig.clientSecret}
                        onChange={(e) =>
                          setSasaPayConfig({
                            ...sasaPayConfig,
                            clientSecret: e.target.value,
                          })
                        }
                        placeholder="Enter your Client Secret"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={sasaPayConfig.webhookUrl}
                      onChange={(e) =>
                        setSasaPayConfig({
                          ...sasaPayConfig,
                          webhookUrl: e.target.value,
                        })
                      }
                      placeholder="https://your-domain.com/api/webhooks/sasapay"
                    />
                  </div>
                </div>
              )}

              {selectedPaymentMethod === "mpesa" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consumerKey">Consumer Key</Label>
                      <Input
                        id="consumerKey"
                        type="password"
                        value={mpesaConfig.consumerKey}
                        onChange={(e) =>
                          setMpesaConfig({
                            ...mpesaConfig,
                            consumerKey: e.target.value,
                          })
                        }
                        placeholder="Enter Consumer Key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="consumerSecret">Consumer Secret</Label>
                      <Input
                        id="consumerSecret"
                        type="password"
                        value={mpesaConfig.consumerSecret}
                        onChange={(e) =>
                          setMpesaConfig({
                            ...mpesaConfig,
                            consumerSecret: e.target.value,
                          })
                        }
                        placeholder="Enter Consumer Secret"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shortcode">Shortcode</Label>
                      <Input
                        id="shortcode"
                        value={mpesaConfig.shortcode}
                        onChange={(e) =>
                          setMpesaConfig({
                            ...mpesaConfig,
                            shortcode: e.target.value,
                          })
                        }
                        placeholder="Enter Shortcode"
                      />
                    </div>
                    <div>
                      <Label htmlFor="passkey">Passkey</Label>
                      <Input
                        id="passkey"
                        type="password"
                        value={mpesaConfig.passkey}
                        onChange={(e) =>
                          setMpesaConfig({
                            ...mpesaConfig,
                            passkey: e.target.value,
                          })
                        }
                        placeholder="Enter Passkey"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === "bank" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={bankConfig.bankName}
                        onChange={(e) =>
                          setBankConfig({
                            ...bankConfig,
                            bankName: e.target.value,
                          })
                        }
                        placeholder="Enter Bank Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={bankConfig.accountNumber}
                        onChange={(e) =>
                          setBankConfig({
                            ...bankConfig,
                            accountNumber: e.target.value,
                          })
                        }
                        placeholder="Enter Account Number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        value={bankConfig.accountName}
                        onChange={(e) =>
                          setBankConfig({
                            ...bankConfig,
                            accountName: e.target.value,
                          })
                        }
                        placeholder="Enter Account Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="swiftCode">SWIFT Code</Label>
                      <Input
                        id="swiftCode"
                        value={bankConfig.swiftCode}
                        onChange={(e) =>
                          setBankConfig({
                            ...bankConfig,
                            swiftCode: e.target.value,
                          })
                        }
                        placeholder="Enter SWIFT Code"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {selectedPaymentMethod === "sasapay" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dailyLimit">
                        Daily Transaction Limit (KES)
                      </Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        value={sasaPayConfig.dailyLimit}
                        onChange={(e) =>
                          setSasaPayConfig({
                            ...sasaPayConfig,
                            dailyLimit: parseInt(e.target.value),
                          })
                        }
                        placeholder="500000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        SasaPay daily B2C limit: KES 500,000
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="maxSingleTransaction">
                        Max Single Transaction (KES)
                      </Label>
                      <Input
                        id="maxSingleTransaction"
                        type="number"
                        value={sasaPayConfig.maxSingleTransaction}
                        onChange={(e) =>
                          setSasaPayConfig({
                            ...sasaPayConfig,
                            maxSingleTransaction: parseInt(e.target.value),
                          })
                        }
                        placeholder="150000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        SasaPay single B2C limit: KES 150,000
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="c2bFeePercent">C2B Fee (%)</Label>
                      <Input
                        id="c2bFeePercent"
                        type="number"
                        step="0.1"
                        value={sasaPayConfig.c2bFeePercent}
                        onChange={(e) =>
                          setSasaPayConfig({
                            ...sasaPayConfig,
                            c2bFeePercent: parseFloat(e.target.value),
                          })
                        }
                        placeholder="0.2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        C2B fee: 0.2% charged on business
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="c2bFeeCap">C2B Fee Cap (KES)</Label>
                      <Input
                        id="c2bFeeCap"
                        type="number"
                        step="1"
                        value={sasaPayConfig.c2bFeeCap}
                        onChange={(e) =>
                          setSasaPayConfig({
                            ...sasaPayConfig,
                            c2bFeeCap: parseFloat(e.target.value),
                          })
                        }
                        placeholder="150"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum C2B fee cap
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>B2C Fee Structure</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-700 mb-2">
                          Fixed tiered fees based on amount:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span>KES 1-100: Free</span>
                          <span>KES 101-500: KES 7</span>
                          <span>KES 501-1,000: KES 11</span>
                          <span>KES 1,001-2,500: KES 19</span>
                          <span>KES 2,501-5,000: KES 24</span>
                          <span>KES 5,001-10,000: KES 24</span>
                          <span>KES 10,001-15,000: KES 29</span>
                          <span>KES 15,001-20,000: KES 29</span>
                          <span>KES 20,001-150,000: KES 39</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Fee Calculation Examples
                    </h4>
                    <div className="space-y-2 text-sm text-yellow-700">
                      <p>
                        <strong>C2B (Receiving):</strong> KES 10,000 × 0.2% =
                        KES 20
                      </p>
                      <p>
                        <strong>C2B (Receiving):</strong> KES 100,000 × 0.2% =
                        KES 200 → Capped at KES 150
                      </p>
                      <p>
                        <strong>B2C (Sending):</strong> KES 5,000 = KES 24 fee
                      </p>
                      <p>
                        <strong>B2C (Sending):</strong> KES 25,000 = KES 39 fee
                      </p>
                      <p className="text-red-600 font-medium">
                        <strong>⚠️ B2C Limit:</strong> Max KES 150,000 per
                        transaction
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2">
                      ⚠️ Buy Ad Configuration Warnings
                    </h4>
                    <div className="space-y-2 text-sm text-red-700">
                      <p>
                        • Set buy ad max order size to{" "}
                        <strong>KES 150,000</strong> or less to avoid payment
                        failures
                      </p>
                      <p>
                        • Monitor daily usage - SasaPay has a{" "}
                        <strong>KES 500,000 daily limit</strong> for B2C
                        transfers
                      </p>
                      <p>
                        • Consider splitting large orders across multiple days
                        if approaching daily limit
                      </p>
                      <p>
                        • Pause buy ads when daily limit is nearly reached to
                        prevent transaction failures
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSettle"
                      checked={sasaPayConfig.autoSettle}
                      onCheckedChange={(checked) =>
                        setSasaPayConfig({
                          ...sasaPayConfig,
                          autoSettle: checked,
                        })
                      }
                    />
                    <Label htmlFor="autoSettle">
                      Enable automatic settlement
                    </Label>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Security Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      SSL Certificate
                    </span>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      API Encryption
                    </span>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      AES-256
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      Webhook Signature
                    </span>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfigureDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog
        open={isAnalyticsDialogOpen}
        onOpenChange={setIsAnalyticsDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {selectedPaymentMethod === "sasapay"
                ? "SasaPay"
                : selectedPaymentMethod === "mpesa"
                ? "M-Pesa"
                : "Bank Transfer"}{" "}
              Analytics
            </DialogTitle>
            <DialogDescription>
              View performance metrics and transaction analytics
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">
                    Transaction Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    KES 2.8M
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    +15.3% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">99.8%</div>
                  <p className="text-xs text-green-600 mt-1">
                    +0.2% improvement
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">
                    Avg. Processing Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">15s</div>
                  <p className="text-xs text-green-600 mt-1">-5s faster</p>
                </CardContent>
              </Card>
            </div>

            {/* PNL Analytics Section for SasaPay */}
            {selectedPaymentMethod === "sasapay" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    SasaPay PNL Analytics
                  </CardTitle>
                  <CardDescription>
                    Profit & Loss breakdown including SasaPay transaction fees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-700">
                            Revenue (P2P Trades)
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            +KES 145,200
                          </span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          From 24 completed P2P trades
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg bg-red-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-700">
                            SasaPay Fees (Total)
                          </span>
                          <span className="text-lg font-bold text-red-600">
                            -KES 1,240
                          </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          18 B2C + 6 C2B transactions
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">
                            Net Profit
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            KES 143,960
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          99.1% profit margin after fees
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg bg-yellow-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-yellow-700">
                            Fee Impact
                          </span>
                          <span className="text-lg font-bold text-yellow-600">
                            0.9%
                          </span>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          Moderate impact on profitability
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm mb-3">
                      Fee Breakdown by Transaction Type
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium">
                            C2B (Receiving)
                          </span>
                          <p className="text-xs text-gray-600">
                            6 transactions
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-orange-600">
                            KES 350
                          </span>
                          <p className="text-xs text-gray-600">Avg: KES 58.3</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium">
                            B2C (Sending)
                          </span>
                          <p className="text-xs text-gray-600">
                            18 transactions
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-red-600">
                            KES 890
                          </span>
                          <p className="text-xs text-gray-600">Avg: KES 49.4</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-sm mb-3">
                      Transaction Cost Calculator
                    </h4>
                    <div className="grid gap-3 text-xs">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>KES 1,000 (B2C)</span>
                        <span className="font-medium">Fee: KES 11</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>KES 10,000 (B2C)</span>
                        <span className="font-medium">Fee: KES 24</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>KES 50,000 (B2C)</span>
                        <span className="font-medium">Fee: KES 39</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>KES 30,000 (C2B)</span>
                        <span className="font-medium">Fee: KES 60 (0.2%)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        * B2C fees: Tiered structure • C2B fees: 0.2% (max KES
                        150)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-sm">
                        TX_2024_001
                      </TableCell>
                      <TableCell>KES 15,000</TableCell>
                      <TableCell>
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>2 min ago</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">
                        TX_2024_002
                      </TableCell>
                      <TableCell>KES 8,500</TableCell>
                      <TableCell>
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>5 min ago</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAnalyticsDialogOpen(false)}
            >
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Configuration Modal */}
      <Dialog
        open={isApiConfigDialogOpen}
        onOpenChange={setIsApiConfigDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              API Configuration
            </DialogTitle>
            <DialogDescription>
              Manage API settings and test connections
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        API Endpoint
                      </span>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Connected
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Last Test</span>
                      <span className="text-sm text-gray-600">
                        2 minutes ago
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        Response Time
                      </span>
                      <span className="text-sm text-green-600">145ms</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">API Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Rate Limit</span>
                      <span className="text-sm text-gray-600">1000/hour</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        Current Usage
                      </span>
                      <span className="text-sm text-blue-600">234/1000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Reset Time</span>
                      <span className="text-sm text-gray-600">45 minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Webhook Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhookEndpoint">Webhook Endpoint</Label>
                    <Input
                      id="webhookEndpoint"
                      value="https://your-domain.com/api/webhooks/sasapay"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="webhookEnabled" defaultChecked />
                    <Label htmlFor="webhookEnabled">
                      Enable webhook notifications
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApiConfigDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {actionType === "delete" ? "remove" : "disable"} this payment
              method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-red-600 rounded">
                <X className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-red-900">Warning</h4>
                <p className="text-sm text-red-700 mt-1">
                  {selectedPaymentMethod === "sasapay"
                    ? "Disabling SasaPay will affect all active P2P orders using this payment method."
                    : `Removing ${selectedPaymentMethod} integration will permanently delete all configuration data.`}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {actionType === "delete" ? "Remove" : "Disable"} Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
