import { completeExchangeSetup } from "@/lib/auth/exchange-setup-service";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await completeExchangeSetup("okx", body ?? {});
  return NextResponse.json(result.body, { status: result.status });
}
