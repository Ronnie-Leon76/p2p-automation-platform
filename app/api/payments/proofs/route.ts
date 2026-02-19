import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (isPostgresAdapter()) {
    return NextResponse.json({ error: "Payment proofs route is not migrated to Postgres yet." }, { status: 501 });
  }

  try {
    const orderId = new URL(request.url).searchParams.get("order_id");
    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proofs: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch proofs" }, { status: 500 });
  }
}
