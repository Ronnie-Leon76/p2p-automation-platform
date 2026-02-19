import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { prisma } from "@/lib/db/prisma";
import { encrypt } from "@/lib/crypto/encryption";
import { OKXExchange } from "@/lib/exchanges/okx-exchange";
import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function cacheOkxData(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string, okx: OKXExchange) {
  const [userInfo, merchantProfile, balances, paymentMethods] = await Promise.all([
    okx.getUserInfo(),
    okx.getMerchantProfile(),
    okx.getBalance("USDT").then((usdt) => ({ USDT: usdt })),
    okx.getPaymentMethods(),
  ]);

  await supabase.from("user_exchange_data").upsert([
    {
      user_id: userId,
      exchange: "okx",
      data_type: "profile",
      data: userInfo,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: userId,
      exchange: "okx",
      data_type: "merchant_profile",
      data: merchantProfile,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: userId,
      exchange: "okx",
      data_type: "balance",
      data: balances,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    {
      user_id: userId,
      exchange: "okx",
      data_type: "payment_methods",
      data: paymentMethods,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  ]);
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPostgresAdapter()) {
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
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("exchange_credentials")
      .select("id, exchange, api_key, is_active, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("exchange", "okx")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ credential: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        credential: {
          ...data,
          api_key_preview: `${String(data.api_key || "").slice(0, 8)}...${String(data.api_key || "").slice(-4)}`,
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

    if (isPostgresAdapter()) {
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
                userId: user.id,
                exchange: "okx",
                dataType: item.dataType,
              },
            },
            create: {
              userId: user.id,
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

      return NextResponse.json({ success: true }, { status: 200 });
    }

    const supabase = await createServerClient();
    const { error: userProfileError } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      user_type: user.user_metadata?.user_type || "merchant",
      profile_complete: false,
      updated_at: new Date().toISOString(),
    });
    if (userProfileError) {
      return NextResponse.json({ error: userProfileError.message }, { status: 500 });
    }

    const { error: saveError } = await supabase.from("exchange_credentials").upsert({
      user_id: user.id,
      exchange: "okx",
      api_key: encrypt(apiKey),
      api_secret: encrypt(apiSecret),
      passphrase: encrypt(passphrase),
      is_active: true,
      updated_at: new Date().toISOString(),
    });
    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    await cacheOkxData(supabase, user.id, okx);

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

    if (isPostgresAdapter()) {
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
    }

    const supabase = await createServerClient();
    const { error: credentialError } = await supabase
      .from("exchange_credentials")
      .delete()
      .eq("user_id", user.id)
      .eq("exchange", "okx");

    if (credentialError) {
      return NextResponse.json({ error: credentialError.message }, { status: 500 });
    }

    await supabase.from("user_exchange_data").delete().eq("user_id", user.id).eq("exchange", "okx");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 });
  }
}
