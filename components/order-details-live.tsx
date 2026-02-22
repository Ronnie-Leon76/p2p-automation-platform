"use client";

import { PaymentIntegration } from "@/components/payment-integration";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type OrderDetail = {
  id: string;
  order_id: string;
  side: string;
  status: string;
  payment_status: string;
  crypto_currency: string;
  fiat_currency: string;
  amount_crypto: number;
  amount_fiat: number;
  unit_price: number;
  counterparty_nickname: string | null;
  counterparty_user_id: string | null;
  payment_method_name: string | null;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  order_time: string | null;
  payment_time: string | null;
  completion_time: string | null;
  cancellation_time: string | null;
  cancellation_reason: string | null;
  payment_information: string | null;
  payer_name: string | null;
  receipt_url: string | null;
  completion_rate_impact: boolean;
  raw?: Record<string, unknown> | null;
};

type TradingSummary = {
  userId: string;
  tradeCount: number;
  tradeAmount: number;
  side: string | null;
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  disputedOrders: number;
  completionRate: number;
  totalAmount: number;
  avgReleaseMinutes: number | null;
  avgPaymentMinutes: number | null;
};

function formatMoney(value: number | null | undefined): string {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function display(value: string | number | null | undefined, fallback = "Not provided by exchange"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function normalizeOrderStatus(status: string | null | undefined): string {
  const s = String(status || "").toLowerCase();
  if (!s) return "Not provided by exchange";
  if (s.includes("dispute")) return "In dispute";
  if (s.includes("cancel")) return "Canceled";
  if (["completed", "fulfilled", "done", "released", "confirmed"].includes(s)) return "Fulfilled";
  return "In progress";
}

export function OrderDetailsLive({ orderId }: { orderId: string }) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TradingSummary | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: "me" | "counterparty"; text: string; at: string }>>([]);

  useEffect(() => {
    let active = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ order_id: orderId, view: "detail" });
        const response = await fetch(`/api/orders/p2p?${params.toString()}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Failed to load order details");
        if (!active) return;
        setDetail(payload.order ?? null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load order details");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };
    void fetchDetail();
    return () => {
      active = false;
    };
  }, [orderId]);

  const headline = useMemo(() => {
    if (!detail) return "Order Details";
    if (detail.status.includes("cancel")) return "Order is canceled";
    if (["completed", "fulfilled", "done", "released", "confirmed"].includes(detail.status)) return "Order is complete";
    if (detail.status === "pending" || detail.status === "new" || detail.status === "open" || detail.status === "in_progress") {
      return "Pending for seller's release";
    }
    return "Order details";
  }, [detail]);

  const isCanceled = detail?.status?.includes("cancel") ?? false;
  const isCompleted =
    !isCanceled && Boolean(detail && ["completed", "fulfilled", "done", "released", "confirmed"].includes(detail.status));
  const isSell = String(detail?.side || "").toLowerCase() === "sell";
  const showPaymentActions = !isCanceled && !isCompleted;

  useEffect(() => {
    if (!detail || chatMessages.length > 0) return;
    if (isSell) {
      setChatMessages([
        {
          id: "sys-1",
          sender: "counterparty",
          text: "The buyer has reminded you to release the crypto",
          at: "System",
        },
        {
          id: "sys-2",
          sender: "counterparty",
          text: "Please verify if you’ve received the payment.",
          at: "System",
        },
      ]);
      return;
    }
    setChatMessages([
      { id: "1", sender: "counterparty", text: "Hello, please confirm payment details before sending.", at: "Yesterday" },
      { id: "2", sender: "me", text: "Confirmed. I have initiated payment.", at: "Today" },
    ]);
  }, [detail, isSell, chatMessages.length]);

  const fetchTradingSummary = async () => {
    if (!detail?.counterparty_user_id) {
      setSummaryError("Counterparty user ID is unavailable for this order.");
      return;
    }
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const params = new URLSearchParams({
        view: "trading_summary",
        counterparty_user_id: detail.counterparty_user_id,
        quote_currency: detail.fiat_currency || "KES",
      });
      const response = await fetch(`/api/orders/p2p?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Failed to load trading summary");
      setSummary(payload.summary ?? null);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Failed to load trading summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [
      ...prev,
      { id: `${Date.now()}`, sender: "me", text, at: new Date().toLocaleTimeString() },
    ]);
    setChatInput("");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading order details...</CardContent>
      </Card>
    );
  }

  if (error || !detail) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-600">{error || "Order details not available."}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
        <CardHeader>
          <CardTitle>{headline}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCompleted && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Order is complete</AlertTitle>
              <AlertDescription>
                {isSell
                  ? `You sold ${formatMoney(detail.amount_crypto)} ${detail.crypto_currency}`
                  : "The crypto has been transferred to your account."}
              </AlertDescription>
            </Alert>
          )}

          {isCanceled && (
            <>
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <AlertTitle>Order is canceled</AlertTitle>
                <AlertDescription>
                  <span className="font-medium">Reason for cancellation </span>
                  {detail.cancellation_reason || "The order has been canceled due to overtime payment"}
                </AlertDescription>
              </Alert>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {detail.completion_rate_impact
                    ? "This cancellation will affect your completion rate."
                    : "This cancellation won’t affect your completion rate."}
                </AlertDescription>
              </Alert>
            </>
          )}

          {!isSell && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="text-sm text-muted-foreground">You paid</div>
                <div className="text-sm font-semibold">
                  {formatMoney(detail.amount_fiat)} {detail.fiat_currency}
                </div>

                <div className="text-sm text-muted-foreground">Payment method</div>
                <div className="text-sm">{display(detail.payment_method_name)}</div>

                <div className="text-sm text-muted-foreground">Account name</div>
                <div className="text-sm">{display(detail.account_name)}</div>

                <div className="text-sm text-muted-foreground">Account number</div>
                <div className="text-sm">{display(detail.account_number)}</div>

                <div className="text-sm text-muted-foreground">Bank name</div>
                <div className="text-sm">{display(detail.bank_name)}</div>
              </div>

              <Separator />
            </>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="text-sm text-muted-foreground">Order ID</div>
            <div className="text-sm">{display(detail.order_id || detail.id)}</div>

            <div className="text-sm text-muted-foreground">Order time</div>
            <div className="text-sm">{formatDate(detail.order_time)}</div>

            <div className="text-sm text-muted-foreground">Unit price ({detail.crypto_currency})</div>
            <div className="text-sm">
              {formatMoney(detail.unit_price)} {detail.fiat_currency}
            </div>

            <div className="text-sm text-muted-foreground">Quantity</div>
            <div className="text-sm">
              {formatMoney(detail.amount_crypto)} {detail.crypto_currency}
            </div>

            <div className="text-sm text-muted-foreground">Order amount</div>
            <div className="text-sm">
              {formatMoney(detail.amount_fiat)} {detail.fiat_currency}
            </div>

            <div className="text-sm text-muted-foreground">Payment time</div>
            <div className="text-sm">{formatDate(detail.payment_time)}</div>

            <div className="text-sm text-muted-foreground">Order completion time</div>
            <div className="text-sm">{formatDate(detail.completion_time)}</div>

            <div className="text-sm text-muted-foreground">Cancellation time</div>
            <div className="text-sm">{formatDate(detail.cancellation_time)}</div>

            <div className="text-sm text-muted-foreground">Counterparty</div>
            <div className="text-sm">{display(detail.counterparty_nickname)}</div>

            <div className="text-sm text-muted-foreground">Payer's name</div>
            <div className="text-sm">{display(detail.payer_name || detail.counterparty_nickname)}</div>

            <div className="text-sm text-muted-foreground">Payment information</div>
            <div className="text-sm">{display(detail.payment_information || detail.account_number)}</div>

            <div className="text-sm text-muted-foreground">Order status</div>
            <div className="text-sm">{normalizeOrderStatus(detail.status)}</div>

            <div className="text-sm text-muted-foreground">Receipt</div>
            <div className="text-sm">
              {detail.receipt_url ? (
                <a className="text-blue-600 underline" href={detail.receipt_url} target="_blank" rel="noreferrer">
                  Download
                </a>
              ) : (
                "No receipt provided"
              )}
            </div>
          </div>

          <div className="pt-2">
            <Dialog
              open={summaryOpen}
              onOpenChange={(open) => {
                setSummaryOpen(open);
                if (open) void fetchTradingSummary();
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline">View Past Trading History</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Trading Summary with User</DialogTitle>
                  <DialogDescription>Counterparty historical trading metrics from OKX.</DialogDescription>
                </DialogHeader>
                {summaryLoading && <div className="text-sm text-muted-foreground">Loading summary...</div>}
                {summaryError && <div className="text-sm text-red-600">{summaryError}</div>}
                {!summaryLoading && !summaryError && summary && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-muted-foreground">User ID</div><div>{summary.userId}</div>
                    <div className="text-muted-foreground">Number of Trades</div><div>{summary.tradeCount.toLocaleString()}</div>
                    <div className="text-muted-foreground">Total Amount Traded</div><div>{formatMoney(summary.tradeAmount)} {detail.fiat_currency}</div>
                    <div className="text-muted-foreground">Side</div><div className="capitalize">{summary.side || "-"}</div>
                    <div className="text-muted-foreground">Total Orders</div><div>{summary.totalOrders.toLocaleString()}</div>
                    <div className="text-muted-foreground">Completed Orders</div><div>{summary.completedOrders.toLocaleString()}</div>
                    <div className="text-muted-foreground">Canceled Orders</div><div>{summary.canceledOrders.toLocaleString()}</div>
                    <div className="text-muted-foreground">Disputed Orders</div><div>{summary.disputedOrders.toLocaleString()}</div>
                    <div className="text-muted-foreground">Completion Rate</div><div>{summary.completionRate.toFixed(2)}%</div>
                    <div className="text-muted-foreground">Total Amount</div><div>{formatMoney(summary.totalAmount)} {detail.fiat_currency}</div>
                    <div className="text-muted-foreground">Avg Release Time</div><div>{summary.avgReleaseMinutes ?? "-"} mins</div>
                    <div className="text-muted-foreground">Avg Payment Time</div><div>{summary.avgPaymentMinutes ?? "-"} mins</div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {showPaymentActions && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentIntegration orderId={detail.order_id || detail.id} />
          </CardContent>
        </Card>
      )}
      </div>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Order Chat</CardTitle>
          <p className="text-xs text-muted-foreground">
            Counterparty: {display(detail.counterparty_nickname)}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isSell && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              Reminder: To avoid losses, do not release crypto until full payment is confirmed in your bank account or wallet.
            </div>
          )}
          <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md border bg-slate-50 p-3">
            {chatMessages.map((m) => (
              <div key={m.id} className={m.sender === "me" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block rounded-md px-3 py-2 text-sm ${
                    m.sender === "me" ? "bg-black text-white" : "bg-white text-gray-900 border"
                  }`}
                >
                  {m.text}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{m.at}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type a message"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChatMessage();
              }}
            />
            <Button onClick={sendChatMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
