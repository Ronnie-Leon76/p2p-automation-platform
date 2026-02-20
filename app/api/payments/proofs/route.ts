import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { listPaymentProofs } from "@/lib/domain/payments/payment-route-use-cases";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const proofs = await listPaymentProofs(searchParams.get("order_id"), searchParams.get("transaction_id"));

    return NextResponse.json({ proofs }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payment proofs" },
      { status: 500 },
    );
  }
}
