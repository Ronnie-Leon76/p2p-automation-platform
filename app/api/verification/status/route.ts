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

    const { data: profile } = await supabase.from("users").select("email_verified, phone").eq("id", user.id).single();

    return NextResponse.json(
      {
        email: {
          verified: user.email_confirmed_at != null || profile?.email_verified || false,
          verificationSent: false,
        },
        phone: {
          verified: user.phone_confirmed_at != null || false,
          verificationSent: false,
          number: user.phone || profile?.phone || undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to load verification status" }, { status: 500 });
  }
}
