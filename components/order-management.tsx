"use client";

import { DataRefreshControl } from "@/components/data-refresh-control";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useExchangeData } from "@/hooks/use-exchange-data";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isMockMode } from "@/lib/config/environment";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  HelpCircle,
  Search,
  Send,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

// Types
interface Order {
  id: string;
  side: "buy" | "sell";
  cryptocurrency: string;
  cryptoAmount: string;
  currency: string;
  fiatAmount: string;
  unitPrice: string;
  orderStatus:
    | "pending"
    | "payment_pending"
    | "paid"
    | "completed"
    | "disputed"
    | "cancelled";
  paymentStatus:
    | "unpaid"
    | "payment_pending"
    | "paid"
    | "confirmed"
    | "disputed"
    | "refunded";
  paymentMethod: string;
  paymentReference?: string;
  timeRemaining?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  disputeReason?: string;
  counterparty: {
    userId: string;
    nickName: string;
    avatar: string;
    completionRate: number;
    completedOrders: number;
  };
  chatMessages: ChatMessage[];
  // Add field to track who created the order (seller in sell ads, buyer in buy ads)
  creator_user_id: string;
  // Add field to track the current user's role in this specific order
  current_user_role?: "buyer" | "seller";
}

interface ChatMessage {
  id: string;
  sender: "user" | "counterparty" | "system";
  message: string;
  timestamp: string;
  type: "text" | "payment_confirmation" | "dispute" | "system_notification";
}

// Mock data with comprehensive real-time scenarios
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    side: "buy", // This is a BUY-USDT ad, so current user is BUYER
    cryptocurrency: "USDT",
    cryptoAmount: "1,000.00",
    currency: "KES",
    fiatAmount: "150,000",
    unitPrice: "150.00",
    orderStatus: "payment_pending", // Buyer has confirmed payment, waiting for seller to release crypto
    paymentStatus: "payment_pending",
    paymentMethod: "M-Pesa",
    paymentReference: "MPESA-REF-001",
    timeRemaining: 895,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    creator_user_id: "current_user", // Current user created this buy order
    current_user_role: "buyer", // Current user is the buyer
    counterparty: {
      userId: "user_456",
      nickName: "CryptoTrader_KE",
      avatar: "/placeholder-user.jpg",
      completionRate: 98.5,
      completedOrders: 234,
    },
    chatMessages: [
      {
        id: "msg_1",
        sender: "system",
        message: "Order created. Please complete payment within 15 minutes.",
        timestamp: "2024-01-15T10:30:00Z",
        type: "system_notification",
      },
      {
        id: "msg_2",
        sender: "counterparty",
        message:
          "Hello! Please send payment to M-Pesa number 0712345678. Reference: MPESA-REF-001",
        timestamp: "2024-01-15T10:32:00Z",
        type: "text",
      },
    ],
  },
  {
    id: "ORD-002",
    side: "sell", // This is a SELL-USDT ad, so current user is SELLER
    cryptocurrency: "USDT",
    cryptoAmount: "500.00",
    currency: "KES",
    fiatAmount: "75,000",
    unitPrice: "150.00",
    orderStatus: "paid",
    paymentStatus: "paid",
    paymentMethod: "Bank Transfer",
    paymentReference: "BNK-TXN-789",
    createdAt: "2024-01-15T09:15:00Z",
    updatedAt: "2024-01-15T10:45:00Z",
    creator_user_id: "current_user", // Current user created this sell order
    current_user_role: "seller", // Current user is the seller
    counterparty: {
      userId: "user_789",
      nickName: "QuickBuyer",
      avatar: "/placeholder-user.jpg",
      completionRate: 95.2,
      completedOrders: 89,
    },
    chatMessages: [
      {
        id: "msg_3",
        sender: "system",
        message: "Order created. Buyer should send payment details.",
        timestamp: "2024-01-15T09:15:00Z",
        type: "system_notification",
      },
      {
        id: "msg_4",
        sender: "user",
        message:
          "Payment sent! Bank reference: BNK-TXN-789. Please confirm and release USDT.",
        timestamp: "2024-01-15T10:40:00Z",
        type: "payment_confirmation",
      },
      {
        id: "msg_5",
        sender: "system",
        message: "Payment confirmed. Seller can now release cryptocurrency.",
        timestamp: "2024-01-15T10:45:00Z",
        type: "payment_confirmation",
      },
    ],
  },
  {
    id: "ORD-003",
    side: "buy", // BUY-BTC ad, current user is BUYER
    cryptocurrency: "BTC",
    cryptoAmount: "0.001",
    currency: "USD",
    fiatAmount: "42.50",
    unitPrice: "42,500.00",
    orderStatus: "completed",
    paymentStatus: "confirmed",
    paymentMethod: "PayPal",
    paymentReference: "PP-45X7Y2Z1",
    createdAt: "2024-01-14T15:20:00Z",
    updatedAt: "2024-01-14T16:05:00Z",
    completedAt: "2024-01-14T16:05:00Z",
    creator_user_id: "current_user", // Current user created this buy order
    current_user_role: "buyer", // Current user is the buyer
    counterparty: {
      userId: "user_321",
      nickName: "BTCMaster",
      avatar: "/placeholder-user.jpg",
      completionRate: 99.1,
      completedOrders: 567,
    },
    chatMessages: [
      {
        id: "msg_6",
        sender: "system",
        message: "Order created successfully.",
        timestamp: "2024-01-14T15:20:00Z",
        type: "system_notification",
      },
      {
        id: "msg_7",
        sender: "counterparty",
        message: "Payment received! Releasing BTC now.",
        timestamp: "2024-01-14T16:00:00Z",
        type: "text",
      },
      {
        id: "msg_8",
        sender: "system",
        message: "Cryptocurrency released. Order completed successfully!",
        timestamp: "2024-01-14T16:05:00Z",
        type: "system_notification",
      },
    ],
  },
  {
    id: "ORD-004",
    side: "sell", // SELL-ETH ad, current user is SELLER
    cryptocurrency: "ETH",
    cryptoAmount: "0.25",
    currency: "EUR",
    fiatAmount: "425.00",
    unitPrice: "1,700.00",
    orderStatus: "disputed",
    paymentStatus: "disputed",
    paymentMethod: "SEPA Transfer",
    paymentReference: "SEPA-REF-123",
    disputeReason: "Payment not received after 2 hours",
    createdAt: "2024-01-13T11:00:00Z",
    updatedAt: "2024-01-13T14:30:00Z",
    creator_user_id: "current_user", // Current user created this sell order
    current_user_role: "seller", // Current user is the seller
    counterparty: {
      userId: "user_654",
      nickName: "EuroTrader",
      avatar: "/placeholder-user.jpg",
      completionRate: 87.3,
      completedOrders: 45,
    },
    chatMessages: [
      {
        id: "msg_9",
        sender: "system",
        message: "Order created. Awaiting payment confirmation.",
        timestamp: "2024-01-13T11:00:00Z",
        type: "system_notification",
      },
      {
        id: "msg_10",
        sender: "user",
        message:
          "I've sent the SEPA transfer. Reference: SEPA-REF-123. It should arrive within 2 hours.",
        timestamp: "2024-01-13T11:30:00Z",
        type: "text",
      },
      {
        id: "msg_11",
        sender: "counterparty",
        message:
          "I haven't received the payment yet. Can you double-check the reference?",
        timestamp: "2024-01-13T14:00:00Z",
        type: "text",
      },
      {
        id: "msg_12",
        sender: "user",
        message:
          "Opening dispute - payment was sent but not received by counterparty.",
        timestamp: "2024-01-13T14:30:00Z",
        type: "dispute",
      },
      {
        id: "msg_13",
        sender: "system",
        message:
          "Dispute opened. Support team has been notified and will investigate within 24 hours.",
        timestamp: "2024-01-13T14:30:00Z",
        type: "system_notification",
      },
    ],
  },
  {
    id: "ORD-005",
    side: "buy", // BUY-USDT ad, current user is BUYER
    cryptocurrency: "USDT",
    cryptoAmount: "200.00",
    currency: "KES",
    fiatAmount: "30,000",
    unitPrice: "150.00",
    orderStatus: "cancelled",
    paymentStatus: "refunded",
    paymentMethod: "M-Pesa",
    createdAt: "2024-01-12T08:45:00Z",
    updatedAt: "2024-01-12T09:15:00Z",
    creator_user_id: "current_user", // Current user created this buy order
    current_user_role: "buyer", // Current user is the buyer
    counterparty: {
      userId: "user_987",
      nickName: "FastTrader",
      avatar: "/placeholder-user.jpg",
      completionRate: 92.8,
      completedOrders: 156,
    },
    chatMessages: [
      {
        id: "msg_14",
        sender: "system",
        message: "Order created.",
        timestamp: "2024-01-12T08:45:00Z",
        type: "system_notification",
      },
      {
        id: "msg_15",
        sender: "user",
        message:
          "Sorry, I need to cancel this order due to insufficient funds.",
        timestamp: "2024-01-12T09:10:00Z",
        type: "text",
      },
      {
        id: "msg_16",
        sender: "system",
        message: "Order cancelled by buyer. No payment was made.",
        timestamp: "2024-01-12T09:15:00Z",
        type: "system_notification",
      },
    ],
  },
];

// Convert exchange order data to our component format
const convertExchangeOrderToOrder = (exchangeOrder: any): Order => {
  return {
    id: exchangeOrder.orderId || exchangeOrder.id || `order_${Date.now()}`,
    side: exchangeOrder.side === "sell" ? "sell" : "buy",
    cryptocurrency: exchangeOrder.cryptoCurrency || "USDT",
    cryptoAmount: exchangeOrder.cryptoAmount || "0",
    currency: exchangeOrder.fiatCurrency || "USD",
    fiatAmount: exchangeOrder.fiatAmount || "0",
    unitPrice: exchangeOrder.unitPrice || "0",
    orderStatus: convertExchangeOrderStatus(exchangeOrder.orderStatus),
    paymentStatus: convertExchangePaymentStatus(exchangeOrder.paymentStatus),
    paymentMethod: exchangeOrder.paymentMethod || "Bank Transfer",
    paymentReference: exchangeOrder.paymentReference,
    timeRemaining: exchangeOrder.timeRemaining,
    createdAt: exchangeOrder.createTime || new Date().toISOString(),
    updatedAt: exchangeOrder.updateTime || new Date().toISOString(),
    completedAt: exchangeOrder.completedTime,
    disputeReason: exchangeOrder.disputeReason,
    counterparty: {
      userId: exchangeOrder.counterparty?.userId || "unknown",
      nickName: exchangeOrder.counterparty?.nickName || "Anonymous",
      avatar: "",
      completionRate: parseFloat(
        exchangeOrder.counterparty?.completionRate || "0"
      ),
      completedOrders: parseInt(
        exchangeOrder.counterparty?.completedOrders || "0"
      ),
    },
    chatMessages: [],
    creator_user_id: exchangeOrder.creatorUserId || "unknown",
    current_user_role: exchangeOrder.side === "sell" ? "seller" : "buyer",
  };
};

// Convert exchange order status to our format
const convertExchangeOrderStatus = (status: string) => {
  const statusMap: { [key: string]: Order["orderStatus"] } = {
    "0": "pending",
    "1": "payment_pending",
    "2": "paid",
    "3": "completed",
    "4": "cancelled",
    "5": "disputed",
    // Add more mappings as needed
  };
  return statusMap[status] || "pending";
};

// Convert exchange payment status to our format
const convertExchangePaymentStatus = (status: string) => {
  const statusMap: { [key: string]: Order["paymentStatus"] } = {
    "0": "unpaid",
    "1": "payment_pending",
    "2": "paid",
    "3": "confirmed",
    "4": "disputed",
    "5": "refunded",
    // Add more mappings as needed
  };
  return statusMap[status] || "unpaid";
};

// Order Detail Dialog Component
function OrderDetailDialog({
  order,
  onClose,
  onConfirmPayment,
  onReleaseCrypto,
  onOpenDispute,
  onCancelOrder,
}: {
  order: Order;
  onClose: () => void;
  onConfirmPayment: (orderId: string) => void;
  onReleaseCrypto: (orderId: string) => void;
  onOpenDispute: (orderId: string, reason: string) => void;
  onCancelOrder: (orderId: string) => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [isDisputing, setIsDisputing] = useState(false);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message to the backend
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const handleDispute = () => {
    if (disputeReason.trim()) {
      onOpenDispute(order.id, disputeReason);
      setIsDisputing(false);
      setDisputeReason("");
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              order.side === "buy"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {order.side === "buy" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </div>
          {order.side.toUpperCase()} {order.cryptocurrency} - {order.id}
        </DialogTitle>
        <DialogDescription>Order details and communication</DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="chat">
            Chat ({order.chatMessages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {order.cryptoAmount} {order.cryptocurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">
                    {order.fiatAmount} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="font-medium">
                    {order.unitPrice} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </div>
                {order.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-mono text-sm">
                      {order.paymentReference}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order Status:</span>
                  <Badge
                    variant="secondary"
                    className={
                      order.orderStatus === "completed"
                        ? "bg-green-50 text-green-700"
                        : order.orderStatus === "disputed"
                        ? "bg-red-50 text-red-700"
                        : order.orderStatus === "cancelled"
                        ? "bg-gray-50 text-gray-600"
                        : order.orderStatus === "paid"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-yellow-50 text-yellow-700"
                    }
                  >
                    {order.orderStatus.charAt(0).toUpperCase() +
                      order.orderStatus.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status:</span>
                  <Badge variant="outline">
                    {order.paymentStatus.charAt(0).toUpperCase() +
                      order.paymentStatus.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-sm">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                {order.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="text-sm">
                      {new Date(order.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {order.timeRemaining && order.orderStatus === "pending" && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Time Remaining:</span>
                    <span className="font-mono text-yellow-600">
                      {Math.floor(order.timeRemaining / 60)}:
                      {(order.timeRemaining % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Counterparty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={order.counterparty.avatar} />
                  <AvatarFallback>
                    {order.counterparty.nickName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{order.counterparty.nickName}</p>
                  <p className="text-sm text-gray-600">
                    {order.counterparty.completionRate}% completion rate •{" "}
                    {order.counterparty.completedOrders} orders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {/* BUY Orders - Current user is BUYER */}
            {order.side === "buy" && order.current_user_role === "buyer" && (
              <>
                {order.orderStatus === "pending" && (
                  <>
                    <Button
                      onClick={() => onConfirmPayment(order.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Payment Sent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDisputing(true)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Dispute
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onCancelOrder(order.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}

                {order.orderStatus === "payment_pending" && (
                  <>
                    <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          Waiting for seller to release crypto
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your payment confirmation has been sent. The seller will
                        release the cryptocurrency once they verify receipt.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsDisputing(true)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Dispute
                    </Button>
                  </>
                )}
              </>
            )}

            {/* BUY Orders - Current user is SELLER (matched to buyer's buy order) */}
            {order.side === "buy" && order.current_user_role === "seller" && (
              <>
                {order.orderStatus === "payment_pending" && (
                  <Button
                    onClick={() => onReleaseCrypto(order.id)}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Release Cryptocurrency
                  </Button>
                )}
              </>
            )}

            {/* SELL Orders - Current user is SELLER */}
            {order.side === "sell" && order.current_user_role === "seller" && (
              <>
                {order.orderStatus === "pending" && (
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        Waiting for buyer payment
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Please wait for the buyer to send payment and confirm it.
                    </p>
                  </div>
                )}

                {order.orderStatus === "paid" && (
                  <Button
                    onClick={() => onReleaseCrypto(order.id)}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Release Cryptocurrency
                  </Button>
                )}
              </>
            )}

            {/* SELL Orders - Current user is BUYER (matched to seller's sell order) */}
            {order.side === "sell" && order.current_user_role === "buyer" && (
              <>
                {order.orderStatus === "pending" && (
                  <>
                    <Button
                      onClick={() => onConfirmPayment(order.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Payment Sent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDisputing(true)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Dispute
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onCancelOrder(order.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Dispute Form */}
          {isDisputing && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base text-red-800">
                  Open Dispute
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dispute-reason">Reason for dispute</Label>
                  <Textarea
                    id="dispute-reason"
                    placeholder="Please describe the issue in detail..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDispute}>
                    Submit Dispute
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDisputing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <ScrollArea className="h-64 w-full border rounded-md p-4">
            <div className="space-y-4">
              {order.chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white"
                        : message.sender === "system"
                        ? "bg-gray-100 text-gray-800 text-center"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function OrderManagement() {
  // Use environment-appropriate auth
  const supabaseAuth = useSupabaseAuth();
  const mockAuth = isMockMode()
    ? useMockAuth()
    : { user: null, isAuthenticated: false, isLoading: false };

  // Select auth based on environment
  const { user, isAuthenticated } = isMockMode() ? mockAuth : supabaseAuth;

  // Use the exchange data hook for live order data
  const exchangeData = useExchangeData(user?.id || null, "okx", {
    autoRefresh: true,
    refreshInterval: 3, // More frequent refresh for orders (3 minutes)
    includeTypes: ["orders", "balance", "payment_methods", "ads"],
    onRefreshStart: () =>
      console.log("🔄 Order management data refresh started"),
    onRefreshComplete: () =>
      console.log("✅ Order management data refresh completed"),
    onRefreshError: (error) =>
      console.error("❌ Order management data refresh failed:", error),
  });

  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSide, setFilterSide] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Convert exchange data to our order format when available
  useEffect(() => {
    if (exchangeData.orders?.data && Array.isArray(exchangeData.orders.data)) {
      console.log("🔄 Converting exchange orders to component format");
      const convertedOrders = exchangeData.orders.data.map((orderData: any) =>
        convertExchangeOrderToOrder(orderData)
      );
      setOrders([...convertedOrders, ...mockOrders]); // Combine real and mock data
    }
  }, [exchangeData.orders?.data]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.orderStatus === "pending" && order.timeRemaining) {
            const newTimeRemaining = Math.max(0, order.timeRemaining - 1);
            if (newTimeRemaining === 0) {
              return {
                ...order,
                orderStatus: "cancelled" as const,
                paymentStatus: "refunded" as const,
                timeRemaining: undefined,
                updatedAt: new Date().toISOString(),
              };
            }
            return { ...order, timeRemaining: newTimeRemaining };
          }
          return order;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const filteredOrders = orders.filter((order) => {
    if (filterStatus !== "all" && order.orderStatus !== filterStatus)
      return false;
    if (filterSide !== "all" && order.side !== filterSide) return false;
    if (
      searchTerm &&
      !order.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !order.counterparty.nickName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleConfirmPayment = (orderId: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              // For BUY orders (buyer confirming payment sent), set to payment_pending
              // For SELL orders (buyer confirming payment sent), set to paid (awaiting seller confirmation)
              orderStatus:
                order.side === "buy"
                  ? ("payment_pending" as const)
                  : ("paid" as const),
              paymentStatus:
                order.side === "buy"
                  ? ("payment_pending" as const)
                  : ("paid" as const),
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
  };

  const handleReleaseCrypto = (orderId: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              orderStatus: "completed" as const,
              paymentStatus: "confirmed" as const,
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
  };

  const handleOpenDispute = (orderId: string, reason: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              orderStatus: "disputed" as const,
              paymentStatus: "disputed" as const,
              disputeReason: reason,
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              orderStatus: "cancelled" as const,
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "payment_pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "paid":
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "disputed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        variant: "secondary" as const,
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      },
      payment_pending: {
        variant: "secondary" as const,
        className: "bg-orange-50 text-orange-700 border-orange-200",
      },
      paid: {
        variant: "secondary" as const,
        className: "bg-blue-50 text-blue-700 border-blue-200",
      },
      completed: {
        variant: "secondary" as const,
        className: "bg-green-50 text-green-700 border-green-200",
      },
      disputed: {
        variant: "secondary" as const,
        className: "bg-red-50 text-red-700 border-red-200",
      },
      cancelled: {
        variant: "outline" as const,
        className: "bg-gray-50 text-gray-600",
      },
    };

    const statusConfig =
      config[status as keyof typeof config] || config.cancelled;
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {status === "payment_pending"
          ? "Payment Pending"
          : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Calculate statistics
  const stats = {
    active: orders.filter(
      (o) => o.orderStatus === "pending" || o.orderStatus === "payment_pending"
    ).length,
    completed: orders.filter((o) => o.orderStatus === "completed").length,
    disputed: orders.filter((o) => o.orderStatus === "disputed").length,
    totalVolume: orders.reduce(
      (sum, order) => sum + parseFloat(order.fiatAmount.replace(/,/g, "")),
      0
    ),
    successRate: orders.length
      ? (
          (orders.filter((o) => o.orderStatus === "completed").length /
            orders.length) *
          100
        ).toFixed(1)
      : "0",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Management
              </h1>
              <p className="text-gray-600">
                Manage your P2P trading orders with real-time updates and
                comprehensive dispute handling
              </p>
              {/* Live Data Status Indicators */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      exchangeData.orders?.data ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-gray-600">
                    Orders:{" "}
                    {exchangeData.orders?.data ? "Connected" : "Mock Data"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      exchangeData.balance?.data
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-gray-600">
                    Balance: {exchangeData.balance?.data ? "Live" : "Mock"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      exchangeData.paymentMethods?.data
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-gray-600">
                    Payments:{" "}
                    {exchangeData.paymentMethods?.data ? "Live" : "Mock"}
                  </span>
                </div>
                {exchangeData.lastRefresh && (
                  <span className="text-xs text-gray-500">
                    Last update:{" "}
                    {new Date(exchangeData.lastRefresh).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <DataRefreshControl
              isRefreshing={exchangeData.isRefreshing}
              lastRefresh={exchangeData.lastRefresh}
              onRefresh={() => exchangeData.refreshData?.()}
              onRefreshDataType={exchangeData.refreshDataType}
              onClearCache={exchangeData.clearCacheAndReload}
              getDataStatus={exchangeData.getDataStatus}
              errors={exchangeData.errors}
            />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Real-time Updates
                </label>
                <Button
                  variant={isRealTimeEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                >
                  {isRealTimeEnabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.active}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completed}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disputed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.disputed}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Volume
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.totalVolume.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.successRate}%
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Exchange Balance Display */}
        {exchangeData.balance?.data && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Live Exchange Balances
              </CardTitle>
              <CardDescription>
                Real-time balances from your exchange account
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

        {/* Filters and Controls */}
        <Card className="border-gray-200 bg-white shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by order ID or counterparty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="payment_pending">
                      Payment Pending
                    </SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSide} onValueChange={setFilterSide}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="buy">Buy Orders</SelectItem>
                    <SelectItem value="sell">Sell Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Orders</CardTitle>
                <CardDescription className="text-gray-600">
                  View and manage your trading orders
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Order
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Counterparty
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Time
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              order.side === "buy"
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {order.side === "buy" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.side.toUpperCase()} {order.cryptocurrency}
                            </p>
                            <p className="text-sm text-gray-500">{order.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={order.counterparty.avatar} />
                            <AvatarFallback>
                              {order.counterparty.nickName.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.counterparty.nickName}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-500">
                                {order.counterparty.completionRate}%
                              </span>
                              <span className="text-xs text-gray-400">
                                ({order.counterparty.completedOrders} orders)
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.fiatAmount} {order.currency}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.cryptoAmount} {order.cryptocurrency}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.orderStatus)}
                          {getStatusBadge(order.orderStatus)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {order.orderStatus === "pending" &&
                        order.timeRemaining ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-600">
                              {formatTimeRemaining(order.timeRemaining)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {order.orderStatus === "pending" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleConfirmPayment(order.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm Payment
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}

                          {order.orderStatus === "paid" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleReleaseCrypto(order.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Release Crypto
                            </Button>
                          )}

                          {(order.orderStatus === "pending" ||
                            order.orderStatus === "paid") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleOpenDispute(order.id, "Payment issue")
                              }
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Dispute
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Order Detail Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedOrder && (
              <OrderDetailDialog
                order={selectedOrder}
                onClose={() => setIsOrderDialogOpen(false)}
                onConfirmPayment={handleConfirmPayment}
                onReleaseCrypto={handleReleaseCrypto}
                onOpenDispute={handleOpenDispute}
                onCancelOrder={handleCancelOrder}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
