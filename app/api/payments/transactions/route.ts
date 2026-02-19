import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "Payment transactions route is not migrated to Postgres yet." }, { status: 501 });
  }

  try {
    const params = new URL(request.url).searchParams;
    const orderId = params.get("order_id");
    const teamId = params.get("team_id");
    const providerId = params.get("provider_id");

    const supabase = await createServerClient();
    let query = supabase.from("payment_transactions").select("*").order("created_at", { ascending: false });

    if (orderId) query = query.eq("order_id", orderId);
    if (teamId) query = query.eq("team_id", teamId);
    if (providerId) query = query.eq("provider_id", providerId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
