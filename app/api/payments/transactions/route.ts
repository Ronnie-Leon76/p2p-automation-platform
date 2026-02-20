import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { listPaymentTransactions } from "@/lib/domain/payments/payment-route-use-cases";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactions = await listPaymentTransactions({
      orderId: searchParams.get("order_id"),
      providerId: searchParams.get("provider_id"),
      teamId: searchParams.get("team_id"),
      status: searchParams.get("status"),
      limit: Number(searchParams.get("limit") ?? 50),
    });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
