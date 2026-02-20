import { handleMPesaWebhookGet } from "@/lib/domain/payments/mpesa-webhook-use-cases";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json({ error: "MPesa webhook route is not migrated to Prisma yet." }, { status: 501 });
}

export async function GET() {
  return handleMPesaWebhookGet();
}

