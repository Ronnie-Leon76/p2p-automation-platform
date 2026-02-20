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

    let cachedData: Array<{ data_type: string; data: any; expires_at: Date | string }> = [];
    if (isPostgresAdapter()) {
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
      cachedData = rows.map((row) => ({
        data_type: row.dataType,
        data: row.data,
        expires_at: row.expiresAt,
      }));
    } else {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from("user_exchange_data")
        .select("data_type, data, expires_at")
        .eq("user_id", user.id)
        .eq("exchange", "okx")
        .gt("expires_at", new Date().toISOString());

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      cachedData = data ?? [];
    }

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

