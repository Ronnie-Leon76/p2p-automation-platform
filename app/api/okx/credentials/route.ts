import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { encrypt } from "@/lib/crypto/encryption";
import { OKXExchange } from "@/lib/exchanges/okx-exchange";
import { NextRequest, NextResponse } from "next/server";

async function cacheOkxData(userId: string, okx: OKXExchange) {
  const [userInfo, merchantProfile, balances, paymentMethods] = await Promise.all([
    okx.getUserInfo(),
    okx.getMerchantProfile(),
    okx.getBalance("USDT").then((usdt) => ({ USDT: usdt })),
    okx.getPaymentMethods(),
  ]);

  const now = Date.now();
  const cacheItems = [
    { dataType: "profile", data: userInfo, expiresAt: new Date(now + 60 * 60 * 1000) },
    { dataType: "merchant_profile", data: merchantProfile, expiresAt: new Date(now + 60 * 60 * 1000) },
    { dataType: "balance", data: balances, expiresAt: new Date(now + 15 * 60 * 1000) },
    { dataType: "payment_methods", data: paymentMethods, expiresAt: new Date(now + 60 * 60 * 1000) },
  ] as const;

  await Promise.all(
    cacheItems.map((item) =>
      prisma.userExchangeData.upsert({
        where: {
          userId_exchange_dataType: {
            userId,
            exchange: "okx",
            dataType: item.dataType,
          },
        },
        create: {
          userId,
          exchange: "okx",
          dataType: item.dataType,
          data: item.data as any,
          expiresAt: item.expiresAt,
        },
        update: {
          data: item.data as any,
          expiresAt: item.expiresAt,
        },
      })
    )
  );
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credential = await prisma.exchangeCredential.findUnique({
      where: {
        userId_exchange: {
          userId: user.id,
          exchange: "okx",
        },
      },
    });

    if (!credential) {
      return NextResponse.json({ credential: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        credential: {
          id: credential.id,
          exchange: credential.exchange,
          api_key_preview: `${String(credential.apiKey || "").slice(0, 8)}...${String(credential.apiKey || "").slice(-4)}`,
          is_active: credential.isActive,
          created_at: credential.createdAt,
          updated_at: credential.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to load credentials" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { apiKey, apiSecret, passphrase } = await request.json();
    if (!apiKey || !apiSecret || !passphrase) {
      return NextResponse.json({ error: "apiKey, apiSecret, and passphrase are required" }, { status: 400 });
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const okx = new OKXExchange(apiKey, apiSecret, passphrase);
    if (!okx.isConnected) {
      return NextResponse.json({ error: "Failed to initialize OKX connection" }, { status: 400 });
    }

    try {
      await okx.getUserInfo();
    } catch (error) {
      return NextResponse.json({ error: "Failed to verify OKX credentials" }, { status: 400 });
    }

    await prisma.appUser.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email ?? null,
        fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
        userType: user.user_metadata?.user_type ?? "merchant",
        profileComplete: false,
      },
      update: {
        email: user.email ?? undefined,
        fullName: user.user_metadata?.full_name ?? undefined,
        userType: user.user_metadata?.user_type ?? undefined,
      },
    });

    await prisma.exchangeCredential.upsert({
      where: {
        userId_exchange: {
          userId: user.id,
          exchange: "okx",
        },
      },
      create: {
        userId: user.id,
        exchange: "okx",
        apiKey: encrypt(apiKey),
        apiSecret: encrypt(apiSecret),
        passphrase: encrypt(passphrase),
        isActive: true,
      },
      update: {
        apiKey: encrypt(apiKey),
        apiSecret: encrypt(apiSecret),
        passphrase: encrypt(passphrase),
        isActive: true,
      },
    });

    await cacheOkxData(user.id, okx);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.exchangeCredential.deleteMany({
      where: {
        userId: user.id,
        exchange: "okx",
      },
    });
    await prisma.userExchangeData.deleteMany({
      where: {
        userId: user.id,
        exchange: "okx",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 });
  }
}

