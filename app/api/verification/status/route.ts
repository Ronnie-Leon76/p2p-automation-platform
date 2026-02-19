import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { prisma } from "@/lib/db/prisma";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPostgresAdapter()) {
      const [authUser, appUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true },
        }),
        prisma.appUser.findUnique({
          where: { id: user.id },
          select: { phone: true, emailVerifiedLegacy: true },
        }),
      ]);

      return NextResponse.json(
        {
          email: {
            verified: Boolean(authUser?.emailVerified || appUser?.emailVerifiedLegacy),
            verificationSent: false,
          },
          phone: {
            verified: false,
            verificationSent: false,
            number: appUser?.phone || undefined,
          },
        },
        { status: 200 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("users").select("email_verified, phone").eq("id", user.id).single();

    return NextResponse.json(
      {
        email: {
          verified: supabaseUser.email_confirmed_at != null || profile?.email_verified || false,
          verificationSent: false,
        },
        phone: {
          verified: supabaseUser.phone_confirmed_at != null || false,
          verificationSent: false,
          number: supabaseUser.phone || profile?.phone || undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to load verification status" }, { status: 500 });
  }
}
