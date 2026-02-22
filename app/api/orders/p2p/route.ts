import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { listPaymentTransactions, markTransactionCompleted } from "@/lib/domain/payments/payment-route-use-cases";
import { prisma } from "@/lib/db/prisma";
import { getOkxExchangeForAuthenticatedUser } from "@/lib/exchanges/okx-server-auth";
import { NextResponse, type NextRequest } from "next/server";

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
}) {
  const createdTs = Number(order.createdTimestamp);
  const createdAt = Number.isFinite(createdTs) && createdTs > 0 ? new Date(createdTs) : new Date();
  return {
    id: order.orderId,
    side: order.side,
    status: order.orderStatus,
    payment_status: order.paymentStatus,
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const status = searchParams.get("status");
    const statusGroup = searchParams.get("status_group");
    const statusFilter = (searchParams.get("status_filter") || "all").toLowerCase();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("page_size") || "20")));
    const live = searchParams.get("live") !== "0";
    const startDateRaw = searchParams.get("start_date");
    const endDateRaw = searchParams.get("end_date");
    const crypto = (searchParams.get("crypto") || "all").toUpperCase();
    const currency = (searchParams.get("currency") || "all").toUpperCase();

    const pendingStatuses = ["pending", "payment_pending", "matched", "paid", "processing", "reminder_sent"];
    const completedStatuses = ["completed", "fulfilled", "confirmed", "done", "released"];
    const inProgressStatuses = ["pending", "payment_pending", "matched", "paid", "processing", "reminder_sent", "in_progress"];
    const inDisputeStatuses = ["in_dispute", "dispute", "appeal", "disputed"];
    const canceledStatuses = ["cancelled", "canceled"];
    const fulfilledStatuses = ["completed", "fulfilled", "confirmed", "done", "released"];
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

    // Prefer live paged orders from OKX for this endpoint, then persist for local fallback.
    if (
      live &&
      !orderId &&
      statusFilter === "all" &&
      !startDateRaw &&
      !endDateRaw &&
      (statusGroup === "pending" || statusGroup === "completed")
    ) {
      const auth = await getOkxExchangeForAuthenticatedUser();
      if (auth.ok) {
        try {
          const liveResult = await auth.okxExchange.getOrders({
            side: "all",
            // OKX P2P order list pagination is 1-based.
            pageIndex: String(page),
            pageSize: String(pageSize),
            completionStatus: statusGroup,
            cryptoCurrencies: crypto !== "ALL" ? crypto : undefined,
            fiatCurrencies: currency !== "ALL" ? currency : undefined,
          });
          const liveOrders = (liveResult.orders || []).map(mapLiveOrderToApi);

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
            },
            { status: 200 },
          );
        } catch {
          // fall through to local DB fallback
        }
      }
    }

    const where: {
      id?: string;
      status?: string | { in: string[] };
      cryptoCurrency?: string;
      fiatCurrency?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
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
