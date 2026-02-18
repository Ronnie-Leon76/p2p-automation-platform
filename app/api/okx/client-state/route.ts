import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: cachedData, error } = await supabase
      .from("user_exchange_data")
      .select("data_type, data, expires_at")
      .eq("user_id", user.id)
      .eq("exchange", "okx")
      .gt("expires_at", new Date().toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const state: any = { isConnected: false };
    if (cachedData && cachedData.length > 0) {
      state.isConnected = true;
      cachedData.forEach((item: any) => {
        if (item.data_type === "profile") state.userInfo = item.data;
        if (item.data_type === "balance") state.balance = item.data;
        if (item.data_type === "payment_methods") state.paymentMethods = item.data;
      });
    }

    return NextResponse.json({ state }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load OKX client state" }, { status: 500 });
  }
}
