import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

function parseTypes(raw: string | null): string[] {
  if (!raw) {
    return ["profile", "merchant_profile", "balance", "payment_methods", "orders", "ads"];
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exchange = (searchParams.get("exchange") || "okx").toLowerCase();
    const dataTypes = parseTypes(searchParams.get("types"));
    const minimal = searchParams.get("minimal") === "1";

    if (minimal) {
      const appUser = await prisma.appUser.findUnique({
        where: { id: user.id },
        select: { exchangeProvider: true, fullName: true, email: true },
      });

      return NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email ?? appUser?.email ?? null,
            full_name: appUser?.fullName ?? null,
          },
          onboarding: {
            hasCredentials: false,
            hasExchangeData: false,
            profileComplete: false,
            preferredExchange: appUser?.exchangeProvider ?? exchange,
          },
          exchange: {
            exchange,
            records: [],
          },
          preferences: null,
        },
        { status: 200 },
      );
    }

    const [exchangeData, preference, appUser, credentialsCount] = await Promise.all([
      prisma.userExchangeData.findMany({
        where: {
          userId: user.id,
          exchange,
          dataType: { in: dataTypes },
        },
        select: {
          dataType: true,
          data: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
      prisma.userPreference.findUnique({
        where: { userId: user.id },
        select: { data: true, updatedAt: true },
      }),
      prisma.appUser.findUnique({
        where: { id: user.id },
        select: { profileComplete: true, exchangeProvider: true, fullName: true, email: true },
      }),
      prisma.exchangeCredential.count({
        where: { userId: user.id, isActive: true },
      }),
    ]);

    const records = exchangeData.map((item) => ({
      data_type: item.dataType,
      data: item.data,
      created_at: item.createdAt,
      expires_at: item.expiresAt,
    }));

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email ?? appUser?.email ?? null,
          full_name: appUser?.fullName ?? null,
        },
        onboarding: {
          hasCredentials: credentialsCount > 0,
          hasExchangeData: records.length > 0,
          profileComplete: Boolean(appUser?.profileComplete),
          preferredExchange: appUser?.exchangeProvider ?? exchange,
        },
        exchange: {
          exchange,
          records,
        },
        preferences: preference
          ? { data: preference.data, updated_at: preference.updatedAt }
          : null,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to load dashboard bootstrap" }, { status: 500 });
  }
}
