import { handleSasaPayWebhookGet, handleSasaPayWebhookPost } from "@/lib/domain/payments/sasapay-webhook-use-cases";
import { createServerClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  return handleSasaPayWebhookPost(request, supabase);
}

export async function GET() {
  return handleSasaPayWebhookGet();
}
