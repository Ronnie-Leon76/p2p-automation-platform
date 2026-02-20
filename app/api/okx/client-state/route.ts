import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.userExchangeData.findMany({
      where: {
        userId: user.id,
        exchange: "okx",
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        dataType: true,
        data: true,
        expiresAt: true,
      },
    });
    const cachedData: Array<{ data_type: string; data: any; expires_at: Date | string }> = rows.map((row) => ({
      data_type: row.dataType,
      data: row.data,
      expires_at: row.expiresAt,
    }));

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

