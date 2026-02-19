import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { getBackendAdapter } from "@/lib/composition/backend-adapter";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (getBackendAdapter() === "postgres") {
      return NextResponse.json(
        { success: true, message: "Email verification is managed by Better Auth. Check your account email workflow." },
        { status: 200 }
      );
    }

    const supabase = await createServerClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email || "",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Email verification sent! Please check your inbox." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send email verification" }, { status: 500 });
  }
}
