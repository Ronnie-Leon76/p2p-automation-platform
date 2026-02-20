import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (error) {
    return NextResponse.json({ error: "Failed to load verification status" }, { status: 500 });
  }
}

