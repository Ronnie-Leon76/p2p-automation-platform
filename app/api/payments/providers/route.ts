import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { listPaymentProviders } from "@/lib/domain/payments/payment-route-use-cases";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("team_id");
  const providers = await listPaymentProviders(teamId);
  return NextResponse.json({ providers }, { status: 200 });
}
