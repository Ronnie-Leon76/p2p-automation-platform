import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get("dataType");
    const exchange = searchParams.get("exchange") || "okx";

    const records = await prisma.userExchangeData.findMany({
      where: {
        userId: user.id,
        exchange,
        ...(dataType ? { dataType } : {}),
      },
      select: {
        dataType: true,
        data: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json(
      {
        records: records.map((record) => ({
          data_type: record.dataType,
          data: record.data,
          created_at: record.createdAt,
          expires_at: record.expiresAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cache data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { exchange = "okx", dataType, data, expiresAt } = await request.json();
    if (!dataType) {
      return NextResponse.json({ error: "dataType is required" }, { status: 400 });
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.userExchangeData.upsert({
      where: {
        userId_exchange_dataType: {
          userId: user.id,
          exchange,
          dataType,
        },
      },
      create: {
        userId: user.id,
        exchange,
        dataType,
        data,
        expiresAt: new Date(expiresAt),
      },
      update: {
        data,
        expiresAt: new Date(expiresAt),
      },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to upsert cache data" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get("exchange");
    const dataType = searchParams.get("dataType");

    await prisma.userExchangeData.deleteMany({
      where: {
        userId: user.id,
        ...(exchange ? { exchange } : {}),
        ...(dataType ? { dataType } : {}),
      },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear cache data" }, { status: 500 });
  }
}

