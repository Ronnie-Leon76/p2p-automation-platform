"use client";

import { getDashboardBootstrapCached, type ClientDashboardBootstrapPayload } from "@/lib/client/dashboard-bootstrap-cache";
import { useEffect, useState } from "react";

export function useDashboardBootstrap(exchange = "okx", types?: string[]) {
  const [data, setData] = useState<ClientDashboardBootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const payload = await getDashboardBootstrapCached({
          exchange,
          types: types || ["profile", "merchant_profile", "balance", "payment_methods", "orders", "ads"],
          minimal: false,
          ttlMs: 10_000,
        });
        if (mounted) setData(payload);
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [exchange, JSON.stringify(types || [])]);

  return { data, loading };
}
