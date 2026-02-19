import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null };
  }
  return { supabase, user };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get("dataType");
    const exchange = searchParams.get("exchange") || "okx";

    let query = supabase
      .from("user_exchange_data")
      .select("data_type, data, created_at, expires_at")
      .eq("user_id", user.id)
      .eq("exchange", exchange);

    if (dataType) {
      query = query.eq("data_type", dataType);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ records: data || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cache data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { exchange = "okx", dataType, data, expiresAt } = await request.json();
    if (!dataType) {
      return NextResponse.json({ error: "dataType is required" }, { status: 400 });
    }

    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("user_exchange_data").upsert({
      user_id: user.id,
      exchange,
      data_type: dataType,
      data,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to upsert cache data" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get("exchange");
    const dataType = searchParams.get("dataType");

    let query = supabase.from("user_exchange_data").delete().eq("user_id", user.id);
    if (exchange) {
      query = query.eq("exchange", exchange);
    }
    if (dataType) {
      query = query.eq("data_type", dataType);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear cache data" }, { status: 500 });
  }
}
