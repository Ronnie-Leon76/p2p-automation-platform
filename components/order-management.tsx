"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, MessageSquare } from "lucide-react"

// Mock data for demonstration
const mockOrders = [
  {
    id: "order_001",
    adId: "ad_001",
    side: "sell",
    cryptoCurrency: "USDT",
    fiatCurrency: "CNY",
    cryptoAmount: "1000",
    fiatAmount: "7250",
    unitPrice: "7.25",
    orderStatus: "new",
    paymentStatus: "unpaid",
    createdAt: "2024-01-15T14:30:00Z",
    counterparty: {
      userId: "user_123",
      nickName: "TradePro",
      completionRate: "98.5%",
    },
    timeRemaining: 900, // 15 minutes in seconds
  },
  {
    id: "order_002",
    adId: "ad_002",
    side: "buy",
    cryptoCurrency: "BTC",
    fiatCurrency: "USD",
    cryptoAmount: "0.05",
    fiatAmount: "2162.50",
    unitPrice: "43250.00",
    orderStatus: "completed",
    paymentStatus: "confirmed",
    createdAt: "2024-01-15T12:15:00Z",
    completedAt: "2024-01-15T12:45:00Z",
    counterparty: {
      userId: "user_456",
      nickName: "CryptoKing",
      completionRate: "95.2%",
    },
  },
  {
    id: "order_003",
    adId: "ad_003",
    side: "sell",
    cryptoCurrency: "ETH",
    fiatCurrency: "EUR",
    cryptoAmount: "2.0",
    fiatAmount: "4901.00",
    unitPrice: "2450.50",
    orderStatus: "cancelled",
    paymentStatus: "unreceived",
    createdAt: "2024-01-15T10:20:00Z",
    cancelledAt: "2024-01-15T11:00:00Z",
    counterparty: {
      userId: "user_789",
      nickName: "EuroTrader",
      completionRate: "92.1%",
    },
  },
  {
    id: "order_004",
    adId: "ad_001",
    side: "sell",
    cryptoCurrency: "USDT",
    fiatCurrency: "CNY",
    cryptoAmount: "500",
    fiatAmount: "3625",
    unitPrice: "7.25",
    orderStatus: "new",
    paymentStatus: "paid",
    createdAt: "2024-01-15T13:45:00Z",
    counterparty: {
      userId: "user_321",
      nickName: "FastPay",
      completionRate: "99.1%",
    },
    timeRemaining: 1200, // 20 minutes in seconds
  },
]

export function OrderManagement() {
  const [orders, setOrders] = useState(mockOrders)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSide, setFilterSide] = useState("all")

  const filteredOrders = orders.filter((order) => {
    if (filterStatus !== "all" && order.orderStatus !== filterStatus) return false
    if (filterSide !== "all" && order.side !== filterSide) return false
    return true
  })

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }

  const handleMarkAsPaid = (orderId: string) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, paymentStatus: "paid" } : order)))
  }

  const handleReleaseCrypto = (orderId: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, orderStatus: "completed", paymentStatus: "confirmed" } : order,
      ),
    )
  }

  const handleCancelOrder = (orderId: string) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, orderStatus: "cancelled" } : order)))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      unpaid: "secondary",
      paid: "default",
      confirmed: "default",
      unreceived: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Order Management</h2>
          <p className="text-gray-400">Monitor and manage your P2P trading orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{orders.filter((o) => o.orderStatus === "new").length}</div>
            <p className="text-xs text-gray-400">Currently processing</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{orders.filter((o) => o.orderStatus === "completed").length}</div>
            <p className="text-xs text-gray-400">+2 from yesterday</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Volume</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$17.9K</div>
            <p className="text-xs text-gray-400">Today's trading volume</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">96.8%</div>
            <p className="text-xs text-gray-400">Order completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Orders Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Orders</CardTitle>
              <CardDescription className="text-gray-400">View and manage your trading orders</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSide} onValueChange={setFilterSide}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(-6)}</TableCell>
                  <TableCell>
                    <Badge variant={order.side === "buy" ? "default" : "secondary"}>{order.side.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    {order.cryptoCurrency}/{order.fiatCurrency}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        {order.cryptoAmount} {order.cryptoCurrency}
                      </div>
                      <div className="text-muted-foreground">
                        {order.fiatAmount} {order.fiatCurrency}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{order.unitPrice}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.orderStatus)}
                      <span className="capitalize">{order.orderStatus}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{order.counterparty.nickName}</div>
                      <div className="text-muted-foreground">{order.counterparty.completionRate}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.orderStatus === "new" && order.timeRemaining ? (
                      <div className="text-sm">
                        <div className="text-red-500">{formatTimeRemaining(order.timeRemaining)}</div>
                        <div className="text-muted-foreground">remaining</div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)} className="text-yellow-400 hover:text-orange-400 hover:bg-white/10">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.orderStatus === "new" && order.paymentStatus === "unpaid" && order.side === "buy" && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(order.id)} className="text-yellow-400 hover:text-orange-400 hover:bg-white/10">
                          Mark Paid
                        </Button>
                      )}
                      {order.orderStatus === "new" && order.paymentStatus === "paid" && order.side === "sell" && (
                        <Button variant="ghost" size="sm" onClick={() => handleReleaseCrypto(order.id)} className="text-green-400 hover:text-green-300 hover:bg-white/10">
                          Release
                        </Button>
                      )}
                      {order.orderStatus === "new" && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancelOrder(order.id)} className="text-red-400 hover:text-red-300 hover:bg-white/10">
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Complete order information and actions</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetailsView
              order={selectedOrder}
              onClose={() => setIsOrderDialogOpen(false)}
              onMarkAsPaid={handleMarkAsPaid}
              onReleaseCrypto={handleReleaseCrypto}
              onCancelOrder={handleCancelOrder}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrderDetailsView({
  order,
  onClose,
  onMarkAsPaid,
  onReleaseCrypto,
  onCancelOrder,
}: {
  order: any
  onClose: () => void
  onMarkAsPaid: (orderId: string) => void
  onReleaseCrypto: (orderId: string) => void
  onCancelOrder: (orderId: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-medium">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant={order.side === "buy" ? "default" : "secondary"}>{order.side.toUpperCase()}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pair:</span>
              <span>
                {order.cryptoCurrency}/{order.fiatCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span>
                {order.cryptoAmount} {order.cryptoCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span>
                {order.fiatAmount} {order.fiatCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Price:</span>
              <span>{order.unitPrice}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status & Timing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Status:</span>
              <span className="capitalize">{order.orderStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status:</span>
              <Badge variant={order.paymentStatus === "confirmed" ? "default" : "secondary"}>
                {order.paymentStatus}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span>{new Date(order.completedAt).toLocaleString()}</span>
              </div>
            )}
            {order.timeRemaining && order.orderStatus === "new" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Remaining:</span>
                <span className="text-red-500">
                  {Math.floor(order.timeRemaining / 60)}:{(order.timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Counterparty Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Counterparty Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-muted-foreground text-sm">Username</span>
              <div className="font-medium">{order.counterparty.nickName}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Completion Rate</span>
              <div className="font-medium">{order.counterparty.completionRate}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">User ID</span>
              <div className="font-medium">{order.counterparty.userId}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose} className="bg-white/5 backdrop-blur-sm border border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30">
          Close
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white/5 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/10 hover:border-yellow-400/50 hover:text-orange-400">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>
          {order.orderStatus === "new" && order.paymentStatus === "unpaid" && order.side === "buy" && (
            <Button
              onClick={() => {
                onMarkAsPaid(order.id)
                onClose()
              }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-yellow-400 hover:bg-white/20 hover:border-yellow-400/50 hover:text-orange-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300"
            >
              Mark as Paid
            </Button>
          )}
          {order.orderStatus === "new" && order.paymentStatus === "paid" && order.side === "sell" && (
            <Button
              onClick={() => {
                onReleaseCrypto(order.id)
                onClose()
              }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-green-400 hover:bg-white/20 hover:border-green-400/50 hover:text-green-300 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300"
            >
              Release Crypto
            </Button>
          )}
          {order.orderStatus === "new" && (
            <Button
              variant="destructive"
              onClick={() => {
                onCancelOrder(order.id)
                onClose()
              }}
              className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 hover:text-red-300"
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
