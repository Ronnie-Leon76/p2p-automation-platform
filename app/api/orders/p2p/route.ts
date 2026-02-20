import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { listPaymentTransactions, markTransactionCompleted } from "@/lib/domain/payments/payment-route-use-cases";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { NextResponse, type NextRequest } from "next/server";

async function findCandidateMatches(orderId: string) {
  const orderRows = await prisma.$queryRaw<Array<{ id: string; amount_fiat: number | string; seller_id: string }>>(
    Prisma.sql`SELECT id, amount_fiat, seller_id FROM orders WHERE id = ${orderId} LIMIT 1`,
  );
  const order = orderRows[0];
  if (!order) return null;
  const amount = Number(order.amount_fiat);
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

  return { order, matches: scored.slice(0, 10) };
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

    const pendingStatuses = ["pending", "payment_pending", "matched", "paid", "processing", "reminder_sent"];
    const completedStatuses = ["completed", "fulfilled", "confirmed", "done", "released"];

    const statusFilter =
      statusGroup === "pending"
        ? Prisma.sql`status = ANY(ARRAY[${Prisma.join(pendingStatuses)}]::text[])`
        : statusGroup === "completed"
          ? Prisma.sql`status = ANY(ARRAY[${Prisma.join(completedStatuses)}]::text[])`
          : status
            ? Prisma.sql`status = ${status}`
            : Prisma.sql`TRUE`;

    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(
      Prisma.sql`
        SELECT *
        FROM orders
        WHERE (${orderId ?? null}::text IS NULL OR id = ${orderId ?? null})
          AND ${statusFilter}
        ORDER BY created_at DESC
        LIMIT 50
      `,
    );

    let pendingCount = 0;
    let completedCount = 0;
    try {
      const [pendingResult, completedResult] = await Promise.all([
        prisma.$queryRaw<Array<{ count: bigint | number }>>(
          Prisma.sql`SELECT COUNT(*)::bigint AS count FROM orders WHERE status = ANY(ARRAY[${Prisma.join(pendingStatuses)}]::text[])`,
        ),
        prisma.$queryRaw<Array<{ count: bigint | number }>>(
          Prisma.sql`SELECT COUNT(*)::bigint AS count FROM orders WHERE status = ANY(ARRAY[${Prisma.join(completedStatuses)}]::text[])`,
        ),
      ]);
      pendingCount = Number(pendingResult[0]?.count ?? 0);
      completedCount = Number(completedResult[0]?.count ?? 0);
    } catch {
      pendingCount = rows.filter((row) =>
        pendingStatuses.includes(String((row.status as string | undefined) ?? "").toLowerCase()),
      ).length;
      completedCount = rows.filter((row) =>
        completedStatuses.includes(String((row.status as string | undefined) ?? "").toLowerCase()),
      ).length;
    }

    return NextResponse.json({ orders: rows, pending_count: pendingCount, completed_count: completedCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch P2P orders" },
      { status: 500 },
    );
  }
}
