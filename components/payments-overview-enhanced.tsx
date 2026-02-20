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
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/config/environment";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowDownCircle,
  ArrowDownLeft,
  ArrowUpCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  MoreHorizontal,
  Play,
  Plus,
  Settings,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// OKX P2P API Interfaces
interface OKXPaymentMethod {
  paymentMethodId: string;
  bankCode?: string;
  bankName?: string;
  bankBranchName?: string;
  paymentMethodNumber: string;
  paymentMethodName: string;
  paymentMethodQrCodeUrl?: string;
  type:
    | "BANK"
    | "ALIPAY"
    | "WXPAY"
    | "WESTERN_UNION"
    | "PAY_PAL"
    | "SWIFT"
    | "PAY_NOW"
    | "PAYTM"
    | "QIWI"
    | "MPESA"
    | "AIRTEL_MONEY";
  currency: string;
  isDisabled: boolean;
  decodingUrl?: string;
  paymentDescription: string;
  adsLinkedCount: string;
  isInstantSettlePayment: string;
}

interface OKXCounterpartyDetail {
  merchantId: string;
  takerPaymentMethod: OKXPaymentMethod;
  orders: string;
  estimatedReleaseTime: string;
  userId: string;
  nickName: string;
  realName: string;
  targetGroup: "common" | "certified" | "diamond" | "all";
  completedOrders: string;
  cancelledOrders: string;
  completedSellOrders: string;
  completionRate: string;
  kycLevel: string;
  acceptStatus: "0" | "1";
  avgPaymentTimeInSeconds: string;
  avgCompletionTimeInSeconds: string;
  createdTimestamp: string;
  hasAlreadyTraded: boolean;
}

interface OKXPendingOrder {
  orderId: string;
  side: "buy" | "sell";
  isBlockTradeCategory: boolean;
  orderStatus: "new" | "cancelled" | "completed";
  isFrozen: boolean;
  cryptoCurrency: string;
  fiatCurrency: string;
  unitPrice: string;
  priceMargin?: string;
  exchangeRate: string;
  cryptoAmount: string;
  fiatAmount: string;
  paymentStatus: "unpaid" | "paid" | "unreceived" | "confirmed" | "rejected";
  createdTimestamp: string;
  completionTimestamp?: string;
  updatedTimestamp: string;
  completionType?: string;
  expiredInSeconds: string;
  expiredAfterInSeconds: string;
  frozenType?: string;
  disputeStatus: "0" | "1" | "2" | "3" | "4";
  disputeType?: string;
  disputeSubType?: string;
  disputeResult?: string;
  disputeTime?: string;
  hasMakerBeenReminded: boolean;
  canRaiseDispute: boolean;
  reviewStatus: "1" | "2" | "3" | "4";
  counterpartyDetail: OKXCounterpartyDetail;
}

// Enhanced Payment Method Interface with SasaPay Integration
interface PaymentMethod {
  id: string;
  type:
    | "mpesa_paybill"
    | "sasapay_mpesa"
    | "sasapay_airtel"
    | "sasapay_bank"
    | "bank"
    | "paypal"
    | "wise";
  name: string;
  details: string;
  isVerified: boolean;
  isEnabled: boolean;
  direction: "incoming" | "outgoing" | "both";
  sasapay_config?: {
    method_type: "mpesa" | "airtel" | "bank_transfer";
    max_amount: number;
    min_amount: number;
    fees: number;
    auto_detect: boolean; // Auto-detect payment method from OKX order
  };
  okx_mapping?: {
    // Map OKX payment method types to SasaPay methods
    supported_types: string[];
    priority: number;
  };
  createdAt: string;
}

interface Transaction {
  id: string;
  type:
    | "c2b_payment"
    | "b2c_payout"
    | "trade_payment"
    | "trade_receipt"
    | "deposit"
    | "withdrawal";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentMethod: string;
  counterparty?: string;
  orderId?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  direction: "in" | "out";
  sasapay_details?: {
    transaction_id: string;
    payment_method: string;
    reference: string;
    auto_selected_method?: string;
  };
  okx_order_details?: OKXPendingOrder;
}

export function PaymentsOverview() {
  const [isClient, setIsClient] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isAddMethodDialogOpen, setIsAddMethodDialogOpen] = useState(false);

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

  // SasaPay Payment Method Mapping Logic
  const mapOKXToSasaPay = (
    okxPaymentMethod: OKXPaymentMethod
  ): string | null => {
    const typeMapping: { [key: string]: string } = {
      MPESA: "sasapay_mpesa",
      AIRTEL_MONEY: "sasapay_airtel",
      BANK: "sasapay_bank",
      SWIFT: "sasapay_bank",
      // Fallback mapping for other mobile money services
      PAY_NOW: "sasapay_mpesa", // Singapore's PayNow could map to M-Pesa for Kenya
      ALIPAY: "sasapay_mpesa", // Could be treated as mobile money
      WXPAY: "sasapay_mpesa", // WeChat Pay could map to mobile money
    };

    return typeMapping[okxPaymentMethod.type] || null;
  };

  // Intelligent SasaPay Method Selection
  const selectOptimalSasaPayMethod = (
    amount: number,
    counterpartyPaymentMethod: OKXPaymentMethod,
    userPreferences?: { preferredMethod?: string; autoSelect?: boolean }
  ): string => {
    // Auto-detect based on counterparty's payment method
    const suggestedMethod = mapOKXToSasaPay(counterpartyPaymentMethod);

    if (
      userPreferences?.autoSelect === false &&
      userPreferences?.preferredMethod
    ) {
      return userPreferences.preferredMethod;
    }

    // Smart selection based on amount and method availability
    if (amount < 1000) {
      return suggestedMethod || "sasapay_mpesa"; // Small amounts prefer mobile money
    } else if (amount > 50000) {
      return "sasapay_bank"; // Large amounts use bank transfer
    } else {
      return suggestedMethod || "sasapay_mpesa"; // Default to suggested or M-Pesa
    }
  };

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
        type: "mpesa_paybill",
        name: "M-Pesa Paybill (C2B)",
        details: "Paybill: 400200 | Users pay via this",
        isVerified: true,
        isEnabled: true,
        direction: "incoming",
        createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      },
      {
        id: "2",
        type: "sasapay_mpesa",
        name: "SASAPAY M-Pesa (B2C)",
        details: "Pay users via SASAPAY M-Pesa integration",
        isVerified: true,
        isEnabled: true,
        direction: "outgoing",
        sasapay_config: {
          method_type: "mpesa",
          max_amount: 150000,
          min_amount: 10,
          fees: 0,
          auto_detect: true,
        },
        okx_mapping: {
          supported_types: ["MPESA", "PAY_NOW", "ALIPAY", "WXPAY"],
          priority: 1,
        },
        createdAt: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
      },
      {
        id: "3",
        type: "sasapay_airtel",
        name: "SASAPAY Airtel Money (B2C)",
        details: "Pay users via SASAPAY Airtel integration",
        isVerified: true,
        isEnabled: true,
        direction: "outgoing",
        sasapay_config: {
          method_type: "airtel",
          max_amount: 100000,
          min_amount: 10,
          fees: 0,
          auto_detect: true,
        },
        okx_mapping: {
          supported_types: ["AIRTEL_MONEY"],
          priority: 2,
        },
        createdAt: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
      },
      {
        id: "4",
        type: "sasapay_bank",
        name: "SASAPAY Bank Transfer (B2C)",
        details: "Pay users via SASAPAY bank integration",
        isVerified: true,
        isEnabled: true,
        direction: "outgoing",
        sasapay_config: {
          method_type: "bank_transfer",
          max_amount: 1000000,
          min_amount: 100,
          fees: 0,
          auto_detect: true,
        },
        okx_mapping: {
          supported_types: ["BANK", "SWIFT", "WESTERN_UNION"],
          priority: 3,
        },
        createdAt: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
      },
      {
        id: "5",
        type: "wise",
        name: "Wise Transfer",
        details: "john.doe@email.com",
        isVerified: false,
        isEnabled: false,
        direction: "both",
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
    ];

    // Generate enhanced mock transactions with OKX integration
    const mockTransactions: Transaction[] = [
      {
        id: "1",
        type: "c2b_payment",
        amount: 12500,
        currency: "KES",
        status: "completed",
        paymentMethod: "SASAPAY Paybill",
        counterparty: "user123",
        orderId: "OKX-P2P-001",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3000000).toISOString(),
        notes: "User paid via M-Pesa Paybill for USDT purchase",
        direction: "in",
        sasapay_details: {
          transaction_id: "SASAPAY-TXN-001",
          payment_method: "mpesa_paybill",
          reference: "OKX001USR123",
        },
        okx_order_details: {
          orderId: "OKX-P2P-001",
          side: "sell",
          isBlockTradeCategory: false,
          orderStatus: "completed",
          isFrozen: false,
          cryptoCurrency: "USDT",
          fiatCurrency: "KES",
          unitPrice: "125.00",
          exchangeRate: "125.00",
          cryptoAmount: "100",
          fiatAmount: "12500",
          paymentStatus: "confirmed",
          createdTimestamp: new Date(Date.now() - 3600000).getTime().toString(),
          completionTimestamp: new Date(Date.now() - 3000000)
            .getTime()
            .toString(),
          updatedTimestamp: new Date(Date.now() - 3000000).getTime().toString(),
          expiredInSeconds: "900",
          expiredAfterInSeconds: "86400",
          disputeStatus: "0",
          hasMakerBeenReminded: false,
          canRaiseDispute: false,
          reviewStatus: "3",
          counterpartyDetail: {
            merchantId: "MERCHANT-123",
            takerPaymentMethod: {
              paymentMethodId: "PM-MPESA-001",
              paymentMethodNumber: "+254712345678",
              paymentMethodName: "John's M-Pesa",
              type: "MPESA",
              currency: "KES",
              isDisabled: false,
              paymentDescription: "M-Pesa mobile money",
              adsLinkedCount: "5",
              isInstantSettlePayment: "true",
            },
            orders: "24",
            estimatedReleaseTime: "300",
            userId: "USER-123",
            nickName: "CryptoTrader123",
            realName: "John Doe",
            targetGroup: "certified",
            completedOrders: "22",
            cancelledOrders: "2",
            completedSellOrders: "12",
            completionRate: "91.67",
            kycLevel: "2",
            acceptStatus: "1",
            avgPaymentTimeInSeconds: "240",
            avgCompletionTimeInSeconds: "480",
            createdTimestamp: new Date(Date.now() - 86400000 * 30)
              .getTime()
              .toString(),
            hasAlreadyTraded: false,
          },
        },
      },
      {
        id: "2",
        type: "b2c_payout",
        amount: 8900,
        currency: "KES",
        status: "completed",
        paymentMethod: "SASAPAY M-Pesa",
        counterparty: "user456",
        orderId: "OKX-P2P-002",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        completedAt: new Date(Date.now() - 1500000).toISOString(),
        notes: "Auto-selected M-Pesa based on counterparty's payment method",
        direction: "out",
        sasapay_details: {
          transaction_id: "SASAPAY-TXN-002",
          payment_method: "sasapay_mpesa",
          reference: "OKX002USR456",
          auto_selected_method: "mpesa",
        },
        okx_order_details: {
          orderId: "OKX-P2P-002",
          side: "buy",
          isBlockTradeCategory: false,
          orderStatus: "completed",
          isFrozen: false,
          cryptoCurrency: "BTC",
          fiatCurrency: "KES",
          unitPrice: "8900000.00",
          exchangeRate: "8900000.00",
          cryptoAmount: "0.001",
          fiatAmount: "8900",
          paymentStatus: "confirmed",
          createdTimestamp: new Date(Date.now() - 1800000).getTime().toString(),
          completionTimestamp: new Date(Date.now() - 1500000)
            .getTime()
            .toString(),
          updatedTimestamp: new Date(Date.now() - 1500000).getTime().toString(),
          expiredInSeconds: "900",
          expiredAfterInSeconds: "86400",
          disputeStatus: "0",
          hasMakerBeenReminded: false,
          canRaiseDispute: false,
          reviewStatus: "3",
          counterpartyDetail: {
            merchantId: "MERCHANT-456",
            takerPaymentMethod: {
              paymentMethodId: "PM-MPESA-002",
              paymentMethodNumber: "+254798765432",
              paymentMethodName: "Alice's M-Pesa",
              type: "MPESA",
              currency: "KES",
              isDisabled: false,
              paymentDescription: "M-Pesa mobile money",
              adsLinkedCount: "3",
              isInstantSettlePayment: "true",
            },
            orders: "15",
            estimatedReleaseTime: "300",
            userId: "USER-456",
            nickName: "BTCHodler",
            realName: "Alice Smith",
            targetGroup: "common",
            completedOrders: "14",
            cancelledOrders: "1",
            completedSellOrders: "8",
            completionRate: "93.33",
            kycLevel: "1",
            acceptStatus: "1",
            avgPaymentTimeInSeconds: "180",
            avgCompletionTimeInSeconds: "420",
            createdTimestamp: new Date(Date.now() - 86400000 * 15)
              .getTime()
              .toString(),
            hasAlreadyTraded: true,
          },
        },
      },
      {
        id: "3",
        type: "b2c_payout",
        amount: 67500,
        currency: "KES",
        status: "pending",
        paymentMethod: "SASAPAY Bank Transfer",
        counterparty: "user789",
        orderId: "OKX-P2P-003",
        createdAt: new Date(Date.now() - 900000).toISOString(),
        notes: "Large amount - auto-selected bank transfer",
        direction: "out",
        sasapay_details: {
          transaction_id: "SASAPAY-TXN-003",
          payment_method: "sasapay_bank",
          reference: "OKX003USR789",
          auto_selected_method: "bank_transfer",
        },
        okx_order_details: {
          orderId: "OKX-P2P-003",
          side: "buy",
          isBlockTradeCategory: true,
          orderStatus: "new",
          isFrozen: false,
          cryptoCurrency: "ETH",
          fiatCurrency: "KES",
          unitPrice: "270000.00",
          exchangeRate: "270000.00",
          cryptoAmount: "0.25",
          fiatAmount: "67500",
          paymentStatus: "unpaid",
          createdTimestamp: new Date(Date.now() - 900000).getTime().toString(),
          updatedTimestamp: new Date(Date.now() - 900000).getTime().toString(),
          expiredInSeconds: "1800",
          expiredAfterInSeconds: "86400",
          disputeStatus: "0",
          hasMakerBeenReminded: false,
          canRaiseDispute: false,
          reviewStatus: "1",
          counterpartyDetail: {
            merchantId: "MERCHANT-789",
            takerPaymentMethod: {
              paymentMethodId: "PM-BANK-001",
              bankCode: "01",
              bankName: "KCB Bank Kenya",
              bankBranchName: "Westlands Branch",
              paymentMethodNumber: "1234567890",
              paymentMethodName: "Business Account",
              type: "BANK",
              currency: "KES",
              isDisabled: false,
              paymentDescription: "Bank transfer",
              adsLinkedCount: "8",
              isInstantSettlePayment: "false",
            },
            orders: "45",
            estimatedReleaseTime: "1800",
            userId: "USER-789",
            nickName: "EthereumWhale",
            realName: "Robert Johnson",
            targetGroup: "diamond",
            completedOrders: "42",
            cancelledOrders: "3",
            completedSellOrders: "25",
            completionRate: "93.33",
            kycLevel: "3",
            acceptStatus: "1",
            avgPaymentTimeInSeconds: "900",
            avgCompletionTimeInSeconds: "1200",
            createdTimestamp: new Date(Date.now() - 86400000 * 60)
              .getTime()
              .toString(),
            hasAlreadyTraded: false,
          },
        },
      },
      {
        id: "4",
        type: "withdrawal",
        amount: 25000,
        currency: "KES",
        status: "completed",
        paymentMethod: "KCB Bank",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 85800000).toISOString(),
        notes: "Profit withdrawal",
        direction: "out",
      },
      {
        id: "5",
        type: "deposit",
        amount: 50000,
        currency: "KES",
        status: "completed",
        paymentMethod: "M-Pesa",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 172200000).toISOString(),
        notes: "Trading capital deposit",
        direction: "in",
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
      case "c2b_payment":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case "withdrawal":
      case "trade_payment":
      case "b2c_payout":
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
      case "mpesa_paybill":
        return <Smartphone className="h-4 w-4 text-green-600" />;
      case "sasapay_mpesa":
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      case "sasapay_airtel":
        return <Smartphone className="h-4 w-4 text-red-600" />;
      case "sasapay_bank":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "bank":
        return <CreditCard className="h-4 w-4 text-gray-600" />;
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
          (["deposit", "trade_receipt", "c2b_payment"].includes(t.type) ||
            t.direction === "in") &&
          t.status === "completed"
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSent = transactions
      .filter(
        (t) =>
          (["withdrawal", "trade_payment", "b2c_payout"].includes(t.type) ||
            t.direction === "out") &&
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
                          ["deposit", "trade_receipt", "c2b_payment"].includes(
                            transaction.type
                          )
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {["deposit", "trade_receipt", "c2b_payment"].includes(
                          transaction.type
                        )
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
          {/* OKX Order Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                OKX Order Intelligence
              </CardTitle>
              <CardDescription>
                Smart payment method selection based on OKX P2P order details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Intelligence Summary */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">
                    Smart Payment Processing
                  </h4>
                  <p className="text-sm text-purple-700 mb-3">
                    Automatically detect and select optimal SasaPay methods
                    based on OKX counterparty payment details
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded p-3 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">
                          Auto-Detection
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Map OKX payment methods to SasaPay
                      </p>
                    </div>
                    <div className="bg-white rounded p-3 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">
                          Amount-Based
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Select method based on transaction amount
                      </p>
                    </div>
                    <div className="bg-white rounded p-3 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-sm">
                          Instant Routing
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Real-time payment method routing
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent OKX Orders with Auto-Selection */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">
                    Recent OKX Orders with Auto-Selected Methods
                  </h4>
                  <div className="space-y-3">
                    {transactions
                      .filter((t) => t.okx_order_details)
                      .slice(0, 3)
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="bg-white rounded-lg p-3 border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {transaction.okx_order_details?.side.toUpperCase()}
                              </Badge>
                              <span className="font-medium text-sm">
                                {transaction.okx_order_details?.cryptoCurrency}{" "}
                                / {transaction.okx_order_details?.fiatCurrency}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">
                                {transaction.currency}{" "}
                                {transaction.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div>
                              <p>
                                Counterparty:{" "}
                                {
                                  transaction.okx_order_details
                                    ?.counterpartyDetail.takerPaymentMethod.type
                                }
                              </p>
                              <p>
                                Selected:{" "}
                                {transaction.sasapay_details?.payment_method}
                              </p>
                            </div>
                            <div className="text-right">
                              {transaction.sasapay_details
                                ?.auto_selected_method && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto-Selected
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Payment Method Mapping Configuration */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">
                    Payment Method Mapping Rules
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        OKX MPESA → SasaPay M-Pesa
                      </span>
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        OKX AIRTEL_MONEY → SasaPay Airtel
                      </span>
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        OKX BANK/SWIFT → SasaPay Bank Transfer
                      </span>
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        Amount &gt; 50,000 KES → Force Bank Transfer
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Rule
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        Amount &lt; 1,000 KES → Prefer Mobile Money
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Rule
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* SASAPAY C2B - Users Pay You */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                SASAPAY C2B - Receive Payments (Incoming)
              </CardTitle>
              <CardDescription>
                Configure how users pay you through M-Pesa Paybill
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-900">
                    M-Pesa Paybill Configuration
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Paybill Number
                    </label>
                    <Input
                      placeholder="Your M-Pesa Paybill number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Account Reference
                    </label>
                    <Input
                      placeholder="Account reference format"
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-3">
                  Users will pay using:{" "}
                  <strong>Paybill → Your Number → Account Reference</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SASAPAY B2C - Pay Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-blue-600" />
                SASAPAY B2C - Pay Users (Outgoing)
              </CardTitle>
              <CardDescription>
                Configure how you pay users through SASAPAY's available payment
                methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Smart Payment Method Selection */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Smart Payment Method Selection
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    SASAPAY will automatically select the best payment method
                    based on amount and recipient details
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">M-Pesa</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        For Safaricom users
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        KES 10 - 150,000
                      </p>
                    </div>
                    <div className="bg-white rounded p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-sm">
                          Airtel Money
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">For Airtel users</p>
                      <p className="text-xs text-blue-600 mt-1">
                        KES 10 - 150,000
                      </p>
                    </div>
                    <div className="bg-white rounded p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">
                          Bank Transfer
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        For larger amounts
                      </p>
                      <p className="text-xs text-blue-600 mt-1">KES 1,000+</p>
                    </div>
                  </div>
                </div>

                {/* SASAPAY Configuration */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">
                      SASAPAY Business Account
                    </label>
                    <Input
                      placeholder="Your SASAPAY business account number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      API Configuration
                    </label>
                    <div className="mt-1 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure API
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Payment Limits and Rules */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Payment Rules & Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Minimum Payment Amount
                      </label>
                      <Input type="number" placeholder="10" className="mt-1" />
                      <p className="text-xs text-gray-500 mt-1">
                        KES minimum per transaction
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Maximum Payment Amount
                      </label>
                      <Input
                        type="number"
                        placeholder="150000"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        KES maximum per transaction
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                      <span className="text-sm">
                        Auto-select payment method based on amount
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">
                        Prefer mobile money for amounts under KES 10,000
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">
                        Use bank transfer for amounts over KES 50,000
                      </span>
                    </label>
                  </div>
                </div>

                {/* Payment Testing */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">
                    Test Payments
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Test your SASAPAY B2C integration with small amounts
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Test M-Pesa Payment
                    </Button>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Test Airtel Payment
                    </Button>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Test Bank Transfer
                    </Button>
                  </div>
                </div>
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
                          ["deposit", "trade_receipt", "c2b_payment"].includes(
                            transaction.type
                          )
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {["deposit", "trade_receipt", "c2b_payment"].includes(
                          transaction.type
                        )
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

