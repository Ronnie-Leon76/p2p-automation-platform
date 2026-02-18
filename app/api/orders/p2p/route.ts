import { handleP2PGet, handleP2PPost } from "@/lib/domain/orders/p2p-order-use-cases";
import { createServerClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  return handleP2PPost(request, supabase);
}

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  return handleP2PGet(request, supabase);
}
