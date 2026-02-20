import { handleSasaPayWebhookGet } from "@/lib/domain/payments/sasapay-webhook-use-cases";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json({ error: "SasaPay webhook route is not migrated to Prisma yet." }, { status: 501 });
}

export async function GET() {
  return handleSasaPayWebhookGet();
}

