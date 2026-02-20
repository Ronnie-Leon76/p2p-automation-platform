import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { markTransactionCompleted } from "@/lib/domain/payments/payment-route-use-cases";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const orderId = String(body?.order_id ?? "").trim();
    const transactionId = String(body?.transaction_id ?? "").trim();

    if (!orderId || !transactionId) {
      return NextResponse.json({ error: "order_id and transaction_id are required" }, { status: 400 });
    }

    await markTransactionCompleted(transactionId, orderId);

    return NextResponse.json(
      {
        success: true,
        order_id: orderId,
        transaction_id: transactionId,
        message: "Transaction matched and order marked as paid",
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to match transaction" },
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
    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(
      Prisma.sql`
        SELECT *
        FROM payment_transactions
        WHERE order_id = ${orderId}
        ORDER BY created_at DESC
        LIMIT 20
      `,
    );

    return NextResponse.json({ success: true, matches: rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list matches" },
      { status: 500 },
    );
  }
}
