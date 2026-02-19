import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { handleMPesaWebhookGet, handleMPesaWebhookPost } from "@/lib/domain/payments/mpesa-webhook-use-cases";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "MPesa webhook route is not migrated to Postgres yet." }, { status: 501 });
  }

  const supabase = await createServerClient();
  return handleMPesaWebhookPost(request, supabase);
}

export async function GET() {
  return handleMPesaWebhookGet();
}
