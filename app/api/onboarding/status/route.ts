import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (error) {
    return NextResponse.json({ error: "Failed to load onboarding status" }, { status: 500 });
  }
}

