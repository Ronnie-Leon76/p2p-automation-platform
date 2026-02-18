import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const teamId = new URL(request.url).searchParams.get("team_id");
    if (!teamId) {
      return NextResponse.json({ error: "team_id is required" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("payment_providers")
      .select(
        `
        *,
        team_payment_configs!inner(
          team_id,
          is_active
        )
      `
      )
      .eq("team_payment_configs.team_id", teamId)
      .eq("team_payment_configs.is_active", true)
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ providers: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}
