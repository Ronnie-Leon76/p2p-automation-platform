import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { decrypt } from "@/lib/crypto/encryption";
import { prisma } from "@/lib/db/prisma";
import { OKXExchange } from "@/lib/exchanges/okx-exchange";
import { createServerClient } from "@/lib/database/server-client";

type OkxAuthError = {
  ok: false;
  status: number;
  body: {
    error: string;
    action?: string;
  };
};

type OkxAuthSuccess = {
  ok: true;
  userId: string;
  okxExchange: OKXExchange;
};

export type OkxAuthResult = OkxAuthError | OkxAuthSuccess;

export async function getOkxExchangeForAuthenticatedUser(): Promise<OkxAuthResult> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      ok: false,
      status: 401,
      body: { error: "Authentication required" },
    };
  }

  let encryptedApiKey: string | null = null;
  let encryptedApiSecret: string | null = null;
  let encryptedPassphrase: string | null = null;

  if (isPostgresAdapter()) {
    const credentials = await prisma.exchangeCredential.findFirst({
      where: {
        userId: user.id,
        exchange: "okx",
        isActive: true,
      },
      select: {
        apiKey: true,
        apiSecret: true,
        passphrase: true,
      },
    });
    encryptedApiKey = credentials?.apiKey ?? null;
    encryptedApiSecret = credentials?.apiSecret ?? null;
    encryptedPassphrase = credentials?.passphrase ?? null;
  } else {
    const supabase = await createServerClient();
    const { data: credentials, error } = await supabase
      .from("exchange_credentials")
      .select("api_key, api_secret, passphrase")
      .eq("user_id", user.id)
      .eq("exchange", "okx")
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Failed to load OKX credentials:", error);
    }

    encryptedApiKey = credentials?.api_key ?? null;
    encryptedApiSecret = credentials?.api_secret ?? null;
    encryptedPassphrase = credentials?.passphrase ?? null;
  }

  if (!encryptedApiKey || !encryptedApiSecret || !encryptedPassphrase) {
    return {
      ok: false,
      status: 404,
      body: {
        error: "OKX credentials not found. Please set up your OKX API credentials.",
        action: "setup_required",
      },
    };
  }

  const okxExchange = new OKXExchange(
    decrypt(encryptedApiKey),
    decrypt(encryptedApiSecret),
    decrypt(encryptedPassphrase),
  );

  if (!okxExchange.isConnected) {
    return {
      ok: false,
      status: 400,
      body: { error: "Failed to initialize OKX connection" },
    };
  }

  return {
    ok: true,
    userId: user.id,
    okxExchange,
  };
}

