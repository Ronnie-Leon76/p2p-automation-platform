import { handleMPesaWebhookGet, handleMPesaWebhookPost } from "@/lib/domain/payments/mpesa-webhook-use-cases";
import { createServerClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  return handleMPesaWebhookPost(request, supabase);
}

export async function GET() {
  return handleMPesaWebhookGet();
}
