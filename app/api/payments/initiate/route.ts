import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { createPaymentTransaction } from "@/lib/domain/payments/payment-route-use-cases";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const providerId = String(body?.provider_id ?? "").trim();
    const amount = Number(body?.amount);
    if (!providerId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "provider_id and valid amount are required" }, { status: 400 });
    }

    const transaction = await createPaymentTransaction({
      teamId: (body?.team_id as string | undefined) ?? null,
      providerId,
      orderId: (body?.order_id as string | undefined) ?? null,
      amount,
      currency: (body?.currency as string | undefined) ?? "KES",
      payerPhone: (body?.payer_phone as string | undefined) ?? null,
      payerName: (body?.payer_name as string | undefined) ?? null,
      description: (body?.description as string | undefined) ?? null,
    });

    if (!transaction) {
      return NextResponse.json({ error: "Failed to create payment transaction" }, { status: 500 });
    }

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate payment" },
      { status: 500 },
    );
  }
}
