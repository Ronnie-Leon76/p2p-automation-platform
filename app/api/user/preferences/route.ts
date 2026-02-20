import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preference = await prisma.userPreference.findUnique({
      where: { userId: user.id },
    });
    return NextResponse.json({ preferences: preference?.data ?? null }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.appUser.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        fullName: (body?.full_name as string | undefined) ?? user.user_metadata?.full_name ?? null,
        userType: (body?.user_type as string | undefined) ?? user.user_metadata?.user_type ?? "merchant",
        profileComplete: true,
        exchangeProvider: (body?.exchange_provider as string | undefined) ?? null,
      },
      update: {
        email: user.email,
        fullName: (body?.full_name as string | undefined) ?? undefined,
        userType: (body?.user_type as string | undefined) ?? undefined,
        profileComplete: true,
        exchangeProvider: (body?.exchange_provider as string | undefined) ?? undefined,
      },
    });

    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        data: body,
      },
      update: {
        data: body,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}

