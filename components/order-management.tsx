"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDashboardBootstrap } from "@/hooks/use-dashboard-bootstrap";

type RawOrder = Record<string, unknown>;

type OrderRow = {
  id: string;
  orderType: string;
  quantity: string;
  amount: string;
  unitPrice: string;
  counterparty: string;
  orderStatus: string;
  orderDateTime: string;
};

function toOrderRow(order: RawOrder): OrderRow {
  const id = String(order.id ?? order.order_id ?? "-");
  const side = String(order.side ?? order.order_type ?? "buy").toLowerCase();
  const cryptoQty = Number(order.amount_crypto ?? order.crypto_amount ?? order.quantity ?? 0);
  const cryptoCurrency = String(order.crypto_currency ?? order.cryptocurrency ?? "USDT");
  const fiatAmount = Number(order.amount_fiat ?? order.fiat_amount ?? order.amount ?? 0);
  const fiatCurrency = String(order.fiat_currency ?? order.currency ?? "KES");
  const unitPrice = Number(order.unit_price ?? order.unitPrice ?? order.price ?? 0);
  const status = String(order.status ?? order.order_status ?? "pending");
  const createdAt = String(order.created_at ?? order.createdAt ?? new Date().toISOString());
  const counterparty =
    String(
      order.counterparty_nickname ??
        order.counterparty_name ??
        order.buyer_nickname ??
        order.seller_nickname ??
        order.counterparty ??
        "Counterparty",
    );

  return {
    id,
    orderType: side === "sell" ? "Sell" : "Buy",
    quantity: `${cryptoQty.toLocaleString()} ${cryptoCurrency}`,
    amount: `${fiatAmount.toLocaleString()} ${fiatCurrency}`,
    unitPrice: `${unitPrice.toLocaleString()} ${fiatCurrency}`,
    counterparty,
    orderStatus: status,
    orderDateTime: new Date(createdAt).toLocaleString(),
  };
}

export function OrderManagement() {
  useDashboardBootstrap("okx", ["orders", "profile", "merchant_profile"]);
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async (statusGroup: "pending" | "completed") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/p2p?status_group=${statusGroup}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to fetch orders");
      }
      const rows = Array.isArray(payload.orders) ? payload.orders.map(toOrderRow) : [];
      setOrders(rows);
      setPendingCount(Number(payload.pending_count ?? 0));
      setCompletedCount(Number(payload.completed_count ?? 0));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders(tab);
  }, [tab]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const needle = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(needle) ||
        o.counterparty.toLowerCase().includes(needle) ||
        o.orderStatus.toLowerCase().includes(needle),
    );
  }, [orders, searchTerm]);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6 space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "completed")}>
          <TabsList className="bg-transparent p-0 h-auto gap-6">
            <TabsTrigger value="pending" className="px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">
              Pending <Badge className="ml-2 bg-red-100 text-red-700">{pendingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem></SelectContent>
          </Select>
          <Select defaultValue="all-orders">
            <SelectTrigger className="w-40"><SelectValue placeholder="All orders" /></SelectTrigger>
            <SelectContent><SelectItem value="all-orders">All orders</SelectItem></SelectContent>
          </Select>
          <Select defaultValue="all-labels">
            <SelectTrigger className="w-48"><SelectValue placeholder="All ad labels" /></SelectTrigger>
            <SelectContent><SelectItem value="all-labels">All ad labels</SelectItem></SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search username, order ID"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setSearchTerm("")}>Reset</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-medium text-gray-500">Order ID</th>
                <th className="py-3 text-left font-medium text-gray-500">Order type</th>
                <th className="py-3 text-left font-medium text-gray-500">Order quantity</th>
                <th className="py-3 text-left font-medium text-gray-500">Order amount</th>
                <th className="py-3 text-left font-medium text-gray-500">Unit price</th>
                <th className="py-3 text-left font-medium text-gray-500">Counterparty</th>
                <th className="py-3 text-left font-medium text-gray-500">Order status</th>
                <th className="py-3 text-left font-medium text-gray-500">Order date & time</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-5"><span className="underline">{order.id}</span></td>
                  <td className="py-5"><span className={order.orderType === "Buy" ? "text-green-700 font-semibold" : "text-blue-700 font-semibold"}>{order.orderType}</span></td>
                  <td className="py-5">{order.quantity}</td>
                  <td className="py-5">{order.amount}</td>
                  <td className="py-5">{order.unitPrice}</td>
                  <td className="py-5">{order.counterparty}</td>
                  <td className="py-5">{order.orderStatus}</td>
                  <td className="py-5">{order.orderDateTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <div className="text-sm text-gray-500">Loading orders...</div>}
        {!loading && filteredOrders.length === 0 && (
          <div className="text-sm text-gray-500">No {tab} orders found.</div>
        )}
      </CardContent>
    </Card>
  );
}
