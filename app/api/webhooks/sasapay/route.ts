import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { handleSasaPayWebhookGet, handleSasaPayWebhookPost } from "@/lib/domain/payments/sasapay-webhook-use-cases";
import { createServerClient } from "@/lib/database/server-client";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "SasaPay webhook route is not migrated to Postgres yet." }, { status: 501 });
  }

  const supabase = await createServerClient();
  return handleSasaPayWebhookPost(request, supabase);
}

export async function GET() {
  return handleSasaPayWebhookGet();
}

