import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { handleP2PGet, handleP2PPost } from "@/lib/domain/orders/p2p-order-use-cases";
import { createServerClient } from "@/lib/database/server-client";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json(
      { error: "P2P order routes are not migrated to Postgres yet." },
      { status: 501 },
    );
  }
  const supabase = await createServerClient();
  return handleP2PPost(request, supabase);
}

export async function GET(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json(
      { error: "P2P order routes are not migrated to Postgres yet." },
      { status: 501 },
    );
  }
  const supabase = await createServerClient();
  return handleP2PGet(request, supabase);
}

