import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { encrypt } from "@/lib/crypto/encryption";
import { prisma } from "@/lib/db/prisma";

type ExchangeName = "okx" | "binance" | "bybit";

type CompleteSetupInput = {
  apiKey?: string;
  apiSecret?: string;
  passphrase?: string;
};

export async function completeExchangeSetup(exchange: ExchangeName, input: CompleteSetupInput) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { status: 401 as const, body: { error: "Unauthorized" } };
  }

  const apiKey = input.apiKey?.trim();
  const apiSecret = input.apiSecret?.trim();
  const passphrase = input.passphrase?.trim();
  if (!apiKey || !apiSecret) {
    return { status: 400 as const, body: { error: "apiKey and apiSecret are required" } };
  }
  if (exchange === "okx" && !passphrase) {
    return { status: 400 as const, body: { error: "passphrase is required for OKX" } };
  }

  await prisma.appUser.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? null,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "User",
      userType: (user.user_metadata?.user_type as string | undefined) ?? "merchant",
      exchangeProvider: exchange,
    },
    update: {
      email: user.email ?? undefined,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? undefined,
      userType: (user.user_metadata?.user_type as string | undefined) ?? undefined,
      exchangeProvider: exchange,
    },
  });

  await prisma.exchangeCredential.upsert({
    where: {
      userId_exchange: {
        userId: user.id,
        exchange,
      },
    },
    create: {
      userId: user.id,
      exchange,
      apiKey: encrypt(apiKey),
      apiSecret: encrypt(apiSecret),
      passphrase: passphrase ? encrypt(passphrase) : null,
      isActive: true,
    },
    update: {
      apiKey: encrypt(apiKey),
      apiSecret: encrypt(apiSecret),
      passphrase: passphrase ? encrypt(passphrase) : null,
      isActive: true,
    },
  });

  return { status: 200 as const, body: { success: true } };
}
