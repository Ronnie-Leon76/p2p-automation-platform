import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { prisma } from "@/lib/db/prisma";
import { createServerClient } from "@/lib/database/server-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPostgresAdapter()) {
      const now = new Date();
      const [credentialsCount, exchangeDataCount, userProfile] = await Promise.all([
        prisma.exchangeCredential.count({
          where: {
            userId: user.id,
            isActive: true,
          },
        }),
        prisma.userExchangeData.count({
          where: {
            userId: user.id,
            expiresAt: {
              gt: now,
            },
          },
        }),
        prisma.appUser.findUnique({
          where: { id: user.id },
          select: { profileComplete: true, exchangeProvider: true },
        }),
      ]);

      return NextResponse.json(
        {
          hasCredentials: credentialsCount > 0,
          hasExchangeData: exchangeDataCount > 0,
          profileComplete: Boolean(userProfile?.profileComplete),
        },
        { status: 200 }
      );
    }

    const supabase = await createServerClient();
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

