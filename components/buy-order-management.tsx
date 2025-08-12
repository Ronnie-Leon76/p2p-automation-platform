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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

// Types
interface BuyOrder {
  id: string;
  buyer_id: string;
  amount: number;
  currency: string;
  crypto_amount: number;
  crypto_currency: string;
  exchange_rate: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  created_at: string;
  seller_phone?: string;
  sasapay_transaction_id?: string;
  payment_status?: "pending" | "sent" | "confirmed" | "failed";
}

interface PaymentStatusInfo {
  order_id: string;
  transaction_id?: string;
  checkout_request_id?: string;
  status: string;
  customer_message?: string;
}

export default function BuyOrderManagement() {
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<BuyOrder | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sellerPhone, setSellerPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusInfo | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Mock buy orders for demonstration
  useEffect(() => {
    const mockOrders: BuyOrder[] = [
      {
        id: "buy-001",
        buyer_id: "buyer-123",
        amount: 5000,
        currency: "KES",
        crypto_amount: 0.15,
        crypto_currency: "ETH",
        exchange_rate: 33333.33,
        status: "pending",
        created_at: new Date().toISOString(),
      },
      {
        id: "buy-002",
        buyer_id: "buyer-456",
        amount: 10000,
        currency: "KES",
        crypto_amount: 0.3,
        crypto_currency: "ETH",
        exchange_rate: 33333.33,
        status: "processing",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        seller_phone: "254712345678",
        payment_status: "sent",
      },
    ];
    setBuyOrders(mockOrders);
  }, []);

  const filteredOrders = buyOrders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller_phone?.includes(searchTerm)
  );

  const initiateBuyOrder = async (
    orderId: string,
    buyerId: string,
    phone: string,
    amount: number
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/orders/p2p?action=initiate_buy_order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            buy_order_id: orderId,
            buyer_id: buyerId,
            seller_phone_number: phone,
            amount: amount,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setPaymentStatus({
          order_id: orderId,
          transaction_id: result.transaction_id,
          checkout_request_id: result.checkout_request_id,
          status: "initiated",
          customer_message: result.customer_message,
        });

        // Update order status
        setBuyOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: "processing",
                  seller_phone: phone,
                  payment_status: "sent",
                }
              : order
          )
        );
      } else {
        alert(`Failed to initiate payment: ${result.error}`);
      }
    } catch (error) {
      console.error("Error initiating buy order:", error);
      alert("Failed to initiate payment");
    } finally {
      setLoading(false);
      setShowPaymentDialog(false);
      setSellerPhone("");
    }
  };

  const handleInitiatePayment = (order: BuyOrder) => {
    setSelectedOrder(order);
    setShowPaymentDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-800", icon: ArrowRight },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: XCircle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus) return null;

    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Payment Pending",
      },
      sent: { color: "bg-blue-100 text-blue-800", text: "Payment Sent" },
      confirmed: {
        color: "bg-green-100 text-green-800",
        text: "Payment Confirmed",
      },
      failed: { color: "bg-red-100 text-red-800", text: "Payment Failed" },
    };

    const config =
      statusConfig[paymentStatus as keyof typeof statusConfig] ||
      statusConfig.pending;

    return <Badge className={config.color}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Buy Order Management
          </h2>
          <p className="text-muted-foreground">
            Manage buy orders and initiate B2C payments to sellers
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, buyer ID, or seller phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Buy Orders
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buyOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buyOrders.filter((o) => o.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buyOrders.filter((o) => o.status === "processing").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buyOrders.filter((o) => o.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buy Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Orders</CardTitle>
          <CardDescription>
            Manage and process buy orders with B2C payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Order #{order.id}</span>
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.payment_status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Buyer:</span>{" "}
                          {order.buyer_id}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span>{" "}
                          {order.currency} {order.amount.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Crypto:</span>{" "}
                          {order.crypto_amount} {order.crypto_currency}
                        </div>
                        <div>
                          <span className="font-medium">Rate:</span>{" "}
                          {order.exchange_rate.toLocaleString()}
                        </div>
                        {order.seller_phone && (
                          <div>
                            <span className="font-medium">Seller Phone:</span>{" "}
                            {order.seller_phone}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {order.status === "pending" && (
                        <Button
                          onClick={() => handleInitiatePayment(order)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Initiate Payment
                        </Button>
                      )}

                      {order.status === "processing" && (
                        <Button variant="outline" disabled>
                          <Clock className="w-4 h-4 mr-2" />
                          Processing...
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No buy orders found
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Payment Initiation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate B2C Payment</DialogTitle>
            <DialogDescription>
              Send payment to seller's mobile money account
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order ID:</span>{" "}
                  {selectedOrder.id}
                </div>
                <div>
                  <span className="font-medium">Amount:</span>{" "}
                  {selectedOrder.currency}{" "}
                  {selectedOrder.amount.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller-phone">Seller Phone Number</Label>
                <Input
                  id="seller-phone"
                  placeholder="e.g., 254712345678 or 0712345678"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter Kenya phone number (07xxxxxxxx, 254xxxxxxx, or
                  +254xxxxxxx)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() =>
                    initiateBuyOrder(
                      selectedOrder.id,
                      selectedOrder.buyer_id,
                      sellerPhone,
                      selectedOrder.amount
                    )
                  }
                  disabled={loading || !sellerPhone}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Processing..." : "Send Payment"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setSellerPhone("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Status Display */}
      {paymentStatus && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              Payment Initiated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Order ID:</span>{" "}
                {paymentStatus.order_id}
              </div>
              {paymentStatus.transaction_id && (
                <div>
                  <span className="font-medium">Transaction ID:</span>{" "}
                  {paymentStatus.transaction_id}
                </div>
              )}
              {paymentStatus.checkout_request_id && (
                <div>
                  <span className="font-medium">Checkout Request ID:</span>{" "}
                  {paymentStatus.checkout_request_id}
                </div>
              )}
              {paymentStatus.customer_message && (
                <div>
                  <span className="font-medium">Message:</span>{" "}
                  {paymentStatus.customer_message}
                </div>
              )}
            </div>
            <Button
              onClick={() => setPaymentStatus(null)}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
