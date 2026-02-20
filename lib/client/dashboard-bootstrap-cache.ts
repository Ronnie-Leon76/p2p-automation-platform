"use client";

export interface ClientDashboardBootstrapPayload {
  user: {
    id: string;
    email?: string | null;
    full_name?: string | null;
  };
  onboarding: {
    hasCredentials: boolean;
    hasExchangeData: boolean;
    profileComplete: boolean;
    preferredExchange: string;
  };
  exchange: {
    exchange: string;
    records: Array<{
      data_type: string;
      data: any;
      created_at: string;
      expires_at: string;
    }>;
  };
  preferences: {
    data: any;
    updated_at: string;
  } | null;
}

type CachedEntry = {
  payload: ClientDashboardBootstrapPayload;
  expiresAt: number;
};

const cache = new Map<string, CachedEntry>();
const inFlight = new Map<string, Promise<ClientDashboardBootstrapPayload>>();

function buildKey(exchange: string, types: string[], minimal: boolean): string {
  return `${exchange}|${types.join(",")}|${minimal ? "1" : "0"}`;
}

export async function getDashboardBootstrapCached(options?: {
  exchange?: string;
  types?: string[];
  minimal?: boolean;
  ttlMs?: number;
}): Promise<ClientDashboardBootstrapPayload> {
  const exchange = (options?.exchange || "okx").toLowerCase();
  const types = options?.types || ["profile", "merchant_profile", "balance", "payment_methods", "orders", "ads"];
  const minimal = Boolean(options?.minimal);
  const ttlMs = options?.ttlMs ?? 10_000;
  const key = buildKey(exchange, types, minimal);
  const now = Date.now();

  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.payload;
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    const params = new URLSearchParams({
      exchange,
      types: types.join(","),
    });
    if (minimal) {
      params.set("minimal", "1");
    }

    const response = await fetch(`/api/dashboard/bootstrap?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Bootstrap request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ClientDashboardBootstrapPayload;
    cache.set(key, { payload, expiresAt: Date.now() + ttlMs });
    return payload;
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}

export function invalidateDashboardBootstrapCache() {
  cache.clear();
}
