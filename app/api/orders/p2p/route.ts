import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { listPaymentTransactions, markTransactionCompleted } from "@/lib/domain/payments/payment-route-use-cases";
import { prisma } from "@/lib/db/prisma";
import { getOkxExchangeForAuthenticatedUser } from "@/lib/exchanges/okx-server-auth";
import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

const OKX_LIVE_COOLDOWN_MS = 60_000;
const okxLiveCooldownByUser = new Map<string, number>();

function getUserKey(user: unknown): string {
  const record = user as Record<string, unknown> | null;
  return String(record?.id ?? record?.userId ?? "anonymous");
}

function isSystemError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("OKX_SYSTEM_ERROR") || message.includes("50026");
}

function isLiveCooldownActive(userKey: string): boolean {
  const until = okxLiveCooldownByUser.get(userKey) ?? 0;
  return Date.now() < until;
}

function markLiveCooldown(userKey: string): void {
  okxLiveCooldownByUser.set(userKey, Date.now() + OKX_LIVE_COOLDOWN_MS);
}

async function findCandidateMatches(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, amountFiat: true, sellerId: true },
  });
  if (!order) return null;
  const amount = Number(order.amountFiat ?? 0);
  const minAmount = amount - 1;
  const maxAmount = amount + 1;

  const candidates = await listPaymentTransactions({ orderId: null, status: "completed", limit: 50 });
  const scored = candidates
    .map((tx) => {
      const txAmount = Number(tx.amount ?? 0);
      if (txAmount < minAmount || txAmount > maxAmount) return null;
      const diff = Math.abs(txAmount - amount);
      const score = Math.max(0, 100 - diff * 100);
      return {
        ...tx,
        match_score: score,
        match_reasons: diff === 0 ? ["Exact amount match"] : ["Amount within tolerance"],
        amount_difference: diff,
        hours_ago: 0,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.match_score - a.match_score);

  return {
    order: {
      id: order.id,
      amount_fiat: amount,
      seller_id: order.sellerId,
    },
    matches: scored.slice(0, 10),
  };
}

function toApiOrder(order: {
  id: string;
  side: string | null;
  status: string;
  paymentStatus: string | null;
  sellerId: string | null;
  buyerId: string | null;
  amountCrypto: unknown;
  amountFiat: unknown;
  cryptoCurrency: string | null;
  fiatCurrency: string | null;
  unitPrice: unknown;
  counterpartyNickname: string | null;
  externalOrderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: order.id,
    side: order.side,
    status: order.status,
    payment_status: order.paymentStatus,
    seller_id: order.sellerId,
    buyer_id: order.buyerId,
    amount_crypto: order.amountCrypto != null ? Number(order.amountCrypto) : null,
    amount_fiat: order.amountFiat != null ? Number(order.amountFiat) : null,
    crypto_currency: order.cryptoCurrency,
    fiat_currency: order.fiatCurrency,
            unit_price: order.unitPrice != null ? Number(order.unitPrice) : null,
            counterparty_nickname: order.counterpartyNickname,
            counterparty_user_id: null,
            external_order_id: order.externalOrderId,
            created_at: order.createdAt,
            updated_at: order.updatedAt,
  };
}

function mapLiveOrderToApi(order: {
  orderId: string;
  side: string;
  cryptoCurrency: string;
  fiatCurrency: string;
  cryptoAmount: string;
  fiatAmount: string;
  unitPrice: string;
  orderStatus: string;
  paymentStatus: string;
  createdTimestamp: string;
  counterpartyDetail: { nickName: string };
}, statusGroup?: string | null) {
  const createdTs = Number(order.createdTimestamp);
  const createdAt = Number.isFinite(createdTs) && createdTs > 0 ? new Date(createdTs) : new Date();
  const rawStatus = String(order.orderStatus || "").toLowerCase();
  const normalizedPaymentStatus = String(order.paymentStatus || "").toLowerCase();
  const normalizedStatus = (() => {
    const isDispute =
      rawStatus.includes("dispute") ||
      rawStatus.includes("appeal") ||
      normalizedPaymentStatus.includes("dispute") ||
      normalizedPaymentStatus.includes("appeal");
    const isCanceled = rawStatus.includes("cancel");
    const isCompleted =
      rawStatus.includes("complete") ||
      rawStatus.includes("fulfilled") ||
      rawStatus.includes("release") ||
      rawStatus.includes("confirm") ||
      rawStatus.includes("done");

    if (statusGroup === "completed") return isCanceled ? "canceled" : "fulfilled";
    if (statusGroup === "pending") return isDispute ? "in_dispute" : "in_progress";
    if (isCanceled) return "canceled";
    if (isCompleted) return "fulfilled";
    if (isDispute) return "in_dispute";
    return "in_progress";
  })();
  return {
    id: order.orderId,
    side: order.side,
    status: normalizedStatus,
    payment_status: normalizedPaymentStatus,
    seller_id: null,
    buyer_id: null,
    amount_crypto: Number(order.cryptoAmount || 0),
    amount_fiat: Number(order.fiatAmount || 0),
    crypto_currency: order.cryptoCurrency,
    fiat_currency: order.fiatCurrency,
    unit_price: Number(order.unitPrice || 0),
    counterparty_nickname: order.counterpartyDetail?.nickName || null,
    external_order_id: order.orderId,
    created_at: createdAt,
    updated_at: new Date(),
  };
}

function maskAccountNumber(accountNumber: string | null | undefined): string | null {
  const value = String(accountNumber || "").trim();
  if (!value) return null;
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function mapLiveOrderDetailToApi(order: {
  orderId: string;
  side: string;
  cryptoCurrency: string;
  fiatCurrency: string;
  cryptoAmount: string;
  fiatAmount: string;
  unitPrice: string;
  orderStatus: string;
  paymentStatus: string;
  createdTimestamp: string;
  paymentMethodName?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  paymentTimestamp?: string;
  counterpartyDetail: { userId: string; nickName: string; completionRate: string };
  pendingOrderDetails?: Record<string, unknown>;
}) {
  const raw = (order.pendingOrderDetails || {}) as Record<string, unknown>;
  const firstString = (...values: unknown[]): string | null => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };
  const firstTimestamp = (...values: unknown[]): string | null => {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) return new Date(value).toISOString();
      if (typeof value === "string" && value.trim()) {
        const asNum = Number(value);
        if (Number.isFinite(asNum) && asNum > 0) return new Date(asNum).toISOString();
        const asDate = new Date(value);
        if (!Number.isNaN(asDate.getTime())) return asDate.toISOString();
      }
    }
    return null;
  };
  const completionRateImpactRaw =
    raw.affectCompletionRate ?? raw.completionRateAffected ?? raw.cancelAffectsCompletionRate ?? null;

  const createdTs = Number(order.createdTimestamp);
  const paymentTs = Number(order.paymentTimestamp || "");
  const createdAt = Number.isFinite(createdTs) && createdTs > 0 ? new Date(createdTs) : null;
  const paymentAt = Number.isFinite(paymentTs) && paymentTs > 0 ? new Date(paymentTs) : null;
  const status = String(order.orderStatus || "").toLowerCase();
  const side = String(order.side || "").toLowerCase();

  const cancellationReason = firstString(
    raw.cancelReason,
    raw.cancelReasonDesc,
    raw.cancelReasonDescription,
    raw.cancelMessage,
    raw.cancelledReason,
  );
  const cancellationTime = firstTimestamp(raw.cancelTimestamp, raw.cancelTime, raw.canceledTime, raw.cancelledTime);
  const completionTime = firstTimestamp(
    raw.completeTimestamp,
    raw.completedTimestamp,
    raw.completionTime,
    raw.orderCompletionTime,
    raw.updatedTimestamp,
  );
  const paymentInformation = firstString(raw.paymentInfo, raw.paymentInformation, raw.receiverAccount, raw.payAccount);
  const payerName = firstString(raw.payerName, raw.buyerName, raw.takerName, raw.realName);
  const receiptUrl = firstString(raw.receiptUrl, raw.paymentProofUrl, raw.proofFileUrl, raw.receipt);
  const completionRateImpact =
    typeof completionRateImpactRaw === "boolean"
      ? completionRateImpactRaw
      : status.includes("cancel") && side === "buy";

  return {
    id: order.orderId,
    order_id: order.orderId,
    side,
    status,
    payment_status: String(order.paymentStatus || "").toLowerCase(),
    crypto_currency: String(order.cryptoCurrency || "").toUpperCase(),
    fiat_currency: String(order.fiatCurrency || "").toUpperCase(),
    amount_crypto: Number(order.cryptoAmount || 0),
    amount_fiat: Number(order.fiatAmount || 0),
    unit_price: Number(order.unitPrice || 0),
    counterparty_nickname: order.counterpartyDetail?.nickName || null,
    counterparty_user_id: order.counterpartyDetail?.userId || null,
    payment_method_name: order.paymentMethodName || null,
    account_name: order.accountName || null,
    account_number: maskAccountNumber(order.accountNumber),
    bank_name: order.bankName || null,
    order_time: createdAt?.toISOString() ?? null,
    payment_time: paymentAt?.toISOString() ?? null,
    completion_time: completionTime,
    cancellation_time: cancellationTime,
    cancellation_reason: cancellationReason,
    payment_information: paymentInformation,
    payer_name: payerName,
    receipt_url: receiptUrl,
    completion_rate_impact: completionRateImpact,
    raw: raw,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    if (action === "find_matching_transactions") {
      const orderId = String(body?.order_id ?? "");
      if (!orderId) return NextResponse.json({ error: "order_id is required" }, { status: 400 });
      const result = await findCandidateMatches(orderId);
      if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ success: true, order: result.order, potential_matches: result.matches }, { status: 200 });
    }

    if (action === "confirm_payment_received") {
      const orderId = String(body?.order_id ?? "");
      if (!orderId) return NextResponse.json({ error: "order_id is required" }, { status: 400 });

      const result = await findCandidateMatches(orderId);
      const best = result?.matches?.[0] as Record<string, unknown> | undefined;
      const matchedId = best?.id ? String(best.id) : "";
      if (matchedId) {
        await markTransactionCompleted(matchedId, orderId);
        return NextResponse.json(
          { success: true, message: "Payment confirmed", matched_transaction: best, order_id: orderId },
          { status: 200 },
        );
      }

      return NextResponse.json(
        { success: true, message: "Payment confirmed manually without transaction match", order_id: orderId },
        { status: 200 },
      );
    }

    if (action === "check_payment_status") {
      const transactionId = String(body?.transaction_id ?? "");
      if (!transactionId) return NextResponse.json({ error: "transaction_id is required" }, { status: 400 });
      const transactions = await listPaymentTransactions({ status: null, orderId: null, limit: 200 });
      const transaction = transactions.find((tx) => String((tx as Record<string, unknown>).id ?? "") === transactionId);
      if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      return NextResponse.json({ success: true, transaction }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: find_matching_transactions, confirm_payment_received, check_payment_status" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process P2P request" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userKey = getUserKey(user);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const view = searchParams.get("view");
    const counterpartyUserId = searchParams.get("counterparty_user_id");
    const quoteCurrency = searchParams.get("quote_currency");
    const status = searchParams.get("status");
    const statusGroup = searchParams.get("status_group");
    const statusFilter = (searchParams.get("status_filter") || "all").toLowerCase();
    const searchKeyword = (searchParams.get("search_keyword") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("page_size") || "20")));
    const live = searchParams.get("live") !== "0";
    const startDateRaw = searchParams.get("start_date");
    const endDateRaw = searchParams.get("end_date");
    const crypto = (searchParams.get("crypto") || "all").toUpperCase();
    const currency = (searchParams.get("currency") || "all").toUpperCase();
    const isOrdersListView = !orderId && (statusGroup === "pending" || statusGroup === "completed");
    let staleReason: string | null = null;

    if (view === "trading_summary") {
      const targetUserId = String(counterpartyUserId || "").trim();
      if (!targetUserId) {
        return NextResponse.json({ error: "counterparty_user_id is required" }, { status: 400 });
      }

      const auth = await getOkxExchangeForAuthenticatedUser();
      if (auth.ok && !isLiveCooldownActive(userKey)) {
        try {
          const summary = await auth.okxExchange.getTradingSummaryWithUser({
            userId: targetUserId,
            quoteCurrency: quoteCurrency || undefined,
          });
          return NextResponse.json({ summary, source: "okx_live" }, { status: 200 });
        } catch (error) {
          if (isSystemError(error)) markLiveCooldown(userKey);
          return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to get trading summary" },
            { status: 502 },
          );
        }
      }

      return NextResponse.json(
        { error: "Live OKX trading summary unavailable due to cooldown. Try again shortly." },
        { status: 503 },
      );
    }

    if (orderId && view === "detail") {
      const auth = await getOkxExchangeForAuthenticatedUser();
      if (auth.ok && !isLiveCooldownActive(userKey)) {
        try {
          const liveOrder = await auth.okxExchange.getOrder(orderId);
          if (liveOrder?.orderId) {
            const detail = mapLiveOrderDetailToApi(liveOrder);
            await prisma.order.upsert({
              where: { id: detail.id },
              create: {
                id: detail.id,
                side: detail.side,
                status: detail.status || "pending",
                paymentStatus: detail.payment_status,
                amountCrypto: detail.amount_crypto ?? undefined,
                amountFiat: detail.amount_fiat ?? undefined,
                cryptoCurrency: detail.crypto_currency,
                fiatCurrency: detail.fiat_currency,
                unitPrice: detail.unit_price ?? undefined,
                counterpartyNickname: detail.counterparty_nickname,
                externalOrderId: detail.order_id,
                createdAt: detail.order_time ? new Date(detail.order_time) : new Date(),
              },
              update: {
                side: detail.side,
                status: detail.status || "pending",
                paymentStatus: detail.payment_status,
                amountCrypto: detail.amount_crypto ?? undefined,
                amountFiat: detail.amount_fiat ?? undefined,
                cryptoCurrency: detail.crypto_currency,
                fiatCurrency: detail.fiat_currency,
                unitPrice: detail.unit_price ?? undefined,
                counterpartyNickname: detail.counterparty_nickname,
                externalOrderId: detail.order_id,
                createdAt: detail.order_time ? new Date(detail.order_time) : undefined,
              },
            });

            return NextResponse.json({ order: detail, source: "okx_live" }, { status: 200 });
          }
        } catch (error) {
          if (isSystemError(error)) markLiveCooldown(userKey);
          // fall through to DB fallback
        }
      }

      const fallbackOrder = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderId }, { externalOrderId: orderId }],
        },
      });
      if (!fallbackOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json(
        {
          order: {
            ...toApiOrder(fallbackOrder),
            order_id: fallbackOrder.externalOrderId || fallbackOrder.id,
            order_time: fallbackOrder.createdAt,
            payment_time: null,
            payment_method_name: null,
            account_name: null,
            account_number: null,
            bank_name: null,
            completion_time: null,
            cancellation_time: null,
            cancellation_reason: null,
            payment_information: null,
            payer_name: fallbackOrder.counterpartyNickname,
            receipt_url: null,
            counterparty_user_id: null,
            completion_rate_impact:
              fallbackOrder.status.toLowerCase().includes("cancel") &&
              String(fallbackOrder.side || "").toLowerCase() === "buy",
            raw: null,
          },
          source: "postgres",
        },
        { status: 200 },
      );
    }

    const pendingStatuses = [
      "in_progress",
      "in_dispute",
      "pending",
      "new",
      "open",
      "matched",
      "paid",
      "payment_pending",
      "processing",
      "reminder_sent",
      "dispute",
      "appeal",
      "disputed",
    ];
    const completedStatuses = ["fulfilled", "canceled", "completed", "confirmed", "done", "released", "cancelled"];
    const inProgressStatuses = [
      "in_progress",
      "pending",
      "new",
      "open",
      "matched",
      "paid",
      "payment_pending",
      "processing",
      "reminder_sent",
    ];
    const inDisputeStatuses = ["in_dispute", "dispute", "appeal", "disputed"];
    const canceledStatuses = ["canceled", "cancelled"];
    const fulfilledStatuses = ["fulfilled", "completed", "confirmed", "done", "released"];
    const skip = (page - 1) * pageSize;
    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (startDateRaw) {
      const d = new Date(`${startDateRaw}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) createdAtFilter.gte = d;
    }
    if (endDateRaw) {
      const d = new Date(`${endDateRaw}T23:59:59.999Z`);
      if (!Number.isNaN(d.getTime())) createdAtFilter.lte = d;
    }
    const startMs =
      createdAtFilter.gte && !Number.isNaN(createdAtFilter.gte.getTime())
        ? String(createdAtFilter.gte.getTime())
        : undefined;
    const endMs =
      createdAtFilter.lte && !Number.isNaN(createdAtFilter.lte.getTime())
        ? String(createdAtFilter.lte.getTime())
        : undefined;

    // Prefer live OKX response for paged pending/completed tabs to avoid stale local rows.
    if (isOrdersListView && live && isLiveCooldownActive(userKey)) {
      staleReason = "Showing cached data, last sync failed (OKX temporarily unavailable).";
    }

    if (live && !orderId && (statusGroup === "pending" || statusGroup === "completed") && !isLiveCooldownActive(userKey)) {
      const auth = await getOkxExchangeForAuthenticatedUser();
      if (auth.ok) {
        try {
          const liveResult = await auth.okxExchange.getOrders({
            side: "all",
            // OKX P2P order list pagination is 1-based in this integration.
            pageIndex: String(page),
            pageSize: String(pageSize),
            completionStatus: statusGroup,
            cryptoCurrencies: crypto !== "ALL" ? crypto : undefined,
            fiatCurrencies: currency !== "ALL" ? currency : undefined,
            start: startMs,
            end: endMs,
            searchKeyword: searchKeyword || undefined,
          });
          let liveOrders = (liveResult.orders || []).map((o) => mapLiveOrderToApi(o, statusGroup));
          if (statusGroup === "pending") {
            if (statusFilter === "in_progress") {
              liveOrders = liveOrders.filter((o) => o.status === "in_progress");
            } else if (statusFilter === "in_dispute") {
              liveOrders = liveOrders.filter((o) => o.status === "in_dispute");
            }
          } else if (statusGroup === "completed") {
            if (statusFilter === "fulfilled") {
              liveOrders = liveOrders.filter((o) => o.status === "fulfilled");
            } else if (statusFilter === "canceled") {
              liveOrders = liveOrders.filter((o) => o.status === "canceled");
            }
          }

          // Persist/refresh local snapshot asynchronously for caching and fallback.
          await Promise.all(
            liveOrders.map((o) =>
              prisma.order.upsert({
                where: { id: o.id },
                create: {
                  id: o.id,
                  side: o.side,
                  status: o.status || "pending",
                  paymentStatus: o.payment_status,
                  amountCrypto: o.amount_crypto ?? undefined,
                  amountFiat: o.amount_fiat ?? undefined,
                  cryptoCurrency: o.crypto_currency,
                  fiatCurrency: o.fiat_currency,
                  unitPrice: o.unit_price ?? undefined,
                  counterpartyNickname: o.counterparty_nickname,
                  externalOrderId: o.external_order_id,
                  createdAt: new Date(o.created_at),
                },
                update: {
                  side: o.side,
                  status: o.status || "pending",
                  paymentStatus: o.payment_status,
                  amountCrypto: o.amount_crypto ?? undefined,
                  amountFiat: o.amount_fiat ?? undefined,
                  cryptoCurrency: o.crypto_currency,
                  fiatCurrency: o.fiat_currency,
                  unitPrice: o.unit_price ?? undefined,
                  counterpartyNickname: o.counterparty_nickname,
                  externalOrderId: o.external_order_id,
                  createdAt: new Date(o.created_at),
                },
              }),
            ),
          );

          const pendingCount =
            statusGroup === "pending"
              ? Number(liveResult.total ?? liveOrders.length)
              : await prisma.order.count({ where: { status: { in: pendingStatuses } } });
          const completedCount =
            statusGroup === "completed"
              ? Number(liveResult.total ?? liveOrders.length)
              : await prisma.order.count({ where: { status: { in: completedStatuses } } });

          if (liveOrders.length === 0) {
            throw new Error("Empty mapped live orders; falling back to local snapshot");
          }

          return NextResponse.json(
            {
              orders: liveOrders,
              pending_count: pendingCount,
              completed_count: completedCount,
              pagination: {
                page,
                page_size: pageSize,
                total: Number(liveResult.total ?? liveOrders.length),
                has_more: Boolean(liveResult.hasMore ?? liveOrders.length >= pageSize),
              },
              source: "okx_live",
              stale: false,
              stale_reason: null,
            },
            { status: 200 },
          );
        } catch (error) {
          if (isSystemError(error)) {
            markLiveCooldown(userKey);
            staleReason = "Showing cached data, last sync failed (OKX system error).";
          } else {
            staleReason = "Showing cached data, live sync failed.";
          }
          // fall through to local DB fallback
        }
      } else {
        staleReason = "Showing cached data, unable to authenticate live OKX sync.";
      }
    }

    const where: Prisma.OrderWhereInput = {};
    if (orderId) where.id = orderId;
    if (statusGroup === "pending") {
      if (statusFilter === "in_progress") {
        where.status = { in: inProgressStatuses };
      } else if (statusFilter === "in_dispute") {
        where.status = { in: inDisputeStatuses };
      } else {
        where.status = { in: pendingStatuses };
      }
    } else if (statusGroup === "completed") {
      if (statusFilter === "fulfilled") {
        where.status = { in: fulfilledStatuses };
      } else if (statusFilter === "canceled") {
        where.status = { in: canceledStatuses };
      } else {
        where.status = { in: completedStatuses };
      }
    } else if (status) {
      where.status = status;
    }
    if (crypto !== "ALL") where.cryptoCurrency = crypto;
    if (currency !== "ALL") where.fiatCurrency = currency;
    if (createdAtFilter.gte || createdAtFilter.lte) where.createdAt = createdAtFilter;
    if (searchKeyword) {
      where.OR = [
        { id: { contains: searchKeyword, mode: "insensitive" } },
        { externalOrderId: { contains: searchKeyword, mode: "insensitive" } },
        { counterpartyNickname: { contains: searchKeyword, mode: "insensitive" } },
      ];
    }

    const [orders, total, pendingCount, completedCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.order.count({
        where,
      }),
      prisma.order.count({
        where: { status: { in: pendingStatuses } },
      }),
      prisma.order.count({
        where: { status: { in: completedStatuses } },
      }),
    ]);

    return NextResponse.json(
      {
        orders: orders.map(toApiOrder),
        pending_count: pendingCount,
        completed_count: completedCount,
        pagination: {
          page,
          page_size: pageSize,
          total,
          has_more: skip + orders.length < total,
        },
        source: "postgres",
        stale: isOrdersListView ? true : false,
        stale_reason: isOrdersListView ? staleReason : null,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch P2P orders" },
      { status: 500 },
    );
  }
}
