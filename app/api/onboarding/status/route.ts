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

    const [{ data: credentials }, { data: cachedData }, { data: userProfile }] = await Promise.all([
      supabase.from("exchange_credentials").select("exchange").eq("user_id", user.id).eq("is_active", true),
      supabase
        .from("user_exchange_data")
        .select("data_type")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString()),
      supabase.from("users").select("profile_complete, exchange_provider").eq("id", user.id).single(),
    ]);

    return NextResponse.json(
      {
        hasCredentials: Boolean(credentials && credentials.length > 0),
        hasExchangeData: Boolean(cachedData && cachedData.length > 0),
        profileComplete: Boolean(userProfile?.profile_complete),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to load onboarding status" }, { status: 500 });
  }
}
