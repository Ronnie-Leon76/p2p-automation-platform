"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardBootstrap } from "@/hooks/use-dashboard-bootstrap";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RawOrder = Record<string, unknown>;

type OrderRow = {
  id: string;
  orderType: "Buy" | "Sell";
  quantity: string;
  amount: string;
  unitPrice: string;
  counterparty: string;
  orderStatus: string;
  orderDateTime: string;
};

const CRYPTO_OPTIONS = ["ALL", "BTC", "ETH", "USDC", "USDT"];
const CURRENCY_OPTIONS = [
  "ALL",
  "KES",
  "UGX",
  "TZS",
  "RWF",
  "BIF",
  "ETB",
  "SOS",
  "DJF",
  "ERN",
  "SSP",
  "SDG",
  "KMF",
  "SCR",
  "MUR",
  "MGA",
  "ZAR",
];

function formatDateInput(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayRange() {
  const now = new Date();
  const d = formatDateInput(now);
  return { start: d, end: d };
}

function daysAgoRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - days);
  return { start: formatDateInput(start), end: formatDateInput(end) };
}

function toOrderRow(order: RawOrder): OrderRow {
  const id = String(order.id ?? order.order_id ?? "-");
  const side = String(order.side ?? order.order_type ?? "buy").toLowerCase();
  const cryptoQty = Number(order.amount_crypto ?? order.crypto_amount ?? order.quantity ?? 0);
  const cryptoCurrency = String(order.crypto_currency ?? order.cryptocurrency ?? "USDT").toUpperCase();
  const fiatAmount = Number(order.amount_fiat ?? order.fiat_amount ?? order.amount ?? 0);
  const fiatCurrency = String(order.fiat_currency ?? order.currency ?? "KES").toUpperCase();
  const unitPrice = Number(order.unit_price ?? order.unitPrice ?? order.price ?? 0);
  const statusRaw = String(order.status ?? order.order_status ?? "in_progress").toLowerCase();
  const status =
    statusRaw === "in_dispute" || statusRaw.includes("dispute")
      ? "In dispute"
      : statusRaw === "fulfilled"
        ? "Fulfilled"
        : statusRaw === "canceled" || statusRaw === "cancelled"
          ? "Canceled"
          : "In progress";
  const createdAt = String(order.created_at ?? order.createdAt ?? new Date().toISOString());
  const counterparty = String(
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

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("dispute")) return "bg-amber-100 text-amber-800 border border-amber-200";
  if (s.includes("fulfilled")) return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  if (s.includes("cancel")) return "bg-rose-100 text-rose-700 border border-rose-200";
  return "bg-blue-100 text-blue-800 border border-blue-200";
}

export function OrderManagement() {
  useDashboardBootstrap("okx", ["orders", "profile", "merchant_profile"]);

  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState<"all" | "buy" | "sell">("all");
  const [preset, setPreset] = useState<"today" | "7d" | "30d" | "90d" | "custom">("90d");
  const [startDate, setStartDate] = useState(daysAgoRange(90).start);
  const [endDate, setEndDate] = useState(daysAgoRange(90).end);
  const [crypto, setCrypto] = useState("ALL");
  const [currency, setCurrency] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"okx_live" | "postgres">("postgres");
  const [isStale, setIsStale] = useState(false);
  const [staleReason, setStaleReason] = useState<string | null>(null);

  const statusOptions =
    tab === "pending"
      ? [
          { value: "all", label: "All statuses" },
          { value: "in_progress", label: "In Progress" },
          { value: "in_dispute", label: "In Dispute" },
        ]
      : [
          { value: "all", label: "All statuses" },
          { value: "fulfilled", label: "Fulfilled" },
          { value: "canceled", label: "Canceled" },
        ];

  const applyPreset = (next: "today" | "7d" | "30d" | "90d" | "custom") => {
    setPreset(next);
    if (next === "custom") return;
    if (next === "today") {
      const r = todayRange();
      setStartDate(r.start);
      setEndDate(r.end);
      return;
    }
    const days = next === "7d" ? 7 : next === "30d" ? 30 : 90;
    const r = daysAgoRange(days);
    setStartDate(r.start);
    setEndDate(r.end);
  };

  const fetchOrders = async (targetPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status_group: tab,
        page: String(targetPage),
        page_size: String(pageSize),
        status_filter: statusFilter,
        start_date: startDate,
        end_date: endDate,
        crypto,
        currency,
      });
      if (debouncedSearch) {
        params.set("search_keyword", debouncedSearch);
      }
      const response = await fetch(`/api/orders/p2p?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Failed to fetch orders");

      const rows = Array.isArray(payload.orders) ? payload.orders.map(toOrderRow) : [];
      setOrders(rows);
      setPendingCount(Number(payload.pending_count ?? 0));
      setCompletedCount(Number(payload.completed_count ?? 0));
      setTotal(Number(payload?.pagination?.total ?? rows.length));
      setHasMore(Boolean(payload?.pagination?.has_more));
      setDataSource(payload?.source === "okx_live" ? "okx_live" : "postgres");
      setIsStale(Boolean(payload?.stale));
      setStaleReason(typeof payload?.stale_reason === "string" ? payload.stale_reason : null);
    } catch {
      setOrders([]);
      setTotal(0);
      setHasMore(false);
      setDataSource("postgres");
      setIsStale(true);
      setStaleReason("Showing cached data, live sync request failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    void fetchOrders(page);
  }, [tab, statusFilter, startDate, endDate, crypto, currency, debouncedSearch, page, pageSize]);

  useEffect(() => {
    setStatusFilter("all");
    setPage(1);
  }, [tab]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, startDate, endDate, crypto, currency, debouncedSearch, orderTypeFilter]);

  const filteredOrders = useMemo(() => {
    let rows = orders;
    if (orderTypeFilter !== "all") {
      rows = rows.filter((o) => o.orderType.toLowerCase() === orderTypeFilter);
    }
    return rows;
  }, [orders, orderTypeFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setOrderTypeFilter("all");
    setStatusFilter("all");
    applyPreset("90d");
    setCrypto("ALL");
    setCurrency("ALL");
    setPage(1);
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6 space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "completed")}>
          <TabsList className="bg-transparent p-0 h-auto gap-6">
            <TabsTrigger
              value="pending"
              className="px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black"
            >
              Pending <Badge className="ml-2 bg-red-100 text-red-700">{pendingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black"
            >
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={orderTypeFilter} onValueChange={(v) => setOrderTypeFilter(v as "all" | "buy" | "sell")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All orders</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="disabled" disabled>
            <SelectTrigger className="w-48 opacity-60">
              <SelectValue placeholder="Ad labels unavailable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disabled">Ad labels unavailable</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 rounded-md border px-2 py-1">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPreset("custom");
                setStartDate(e.target.value);
              }}
              className="w-[150px] border-0 p-0 shadow-none focus-visible:ring-0"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPreset("custom");
                setEndDate(e.target.value);
              }}
              className="w-[150px] border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <Select value={preset} onValueChange={(v) => applyPreset(v as "today" | "7d" | "30d" | "90d" | "custom")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
              <SelectItem value="90d">90d</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={crypto} onValueChange={setCrypto}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All crypto" />
            </SelectTrigger>
            <SelectContent>
              {CRYPTO_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === "ALL" ? "All crypto" : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All currencies" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === "ALL" ? "All currencies" : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <div className="relative w-72">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search username, order ID"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>

        {(isStale || dataSource === "okx_live") && (
          <div
            className={`rounded-md border px-3 py-2 text-xs ${
              isStale
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {isStale
              ? staleReason || "Showing cached data, last sync failed."
              : "Live OKX data is active for this view."}
          </div>
        )}

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
              {!loading &&
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-5">
                      <a
                        className="underline text-inherit hover:text-blue-600"
                        href={`/dashboard/orders/${encodeURIComponent(order.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open order details in a new tab"
                      >
                        {order.id}
                      </a>
                    </td>
                    <td className="py-5">
                      <span className={order.orderType === "Buy" ? "text-green-700 font-semibold" : "text-pink-700 font-semibold"}>
                        {order.orderType}
                      </span>
                    </td>
                    <td className="py-5">{order.quantity}</td>
                    <td className="py-5">{order.amount}</td>
                    <td className="py-5">{order.unitPrice}</td>
                    <td className="py-5">{order.counterparty}</td>
                    <td className="py-5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-5">{order.orderDateTime}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading && <div className="text-sm text-gray-500">Loading orders...</div>}
        {!loading && filteredOrders.length === 0 && <div className="text-sm text-gray-500">No {tab} orders found.</div>}

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-gray-500">
            Page {page} • {total.toLocaleString()} total {tab} orders
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" disabled={loading || !hasMore} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
