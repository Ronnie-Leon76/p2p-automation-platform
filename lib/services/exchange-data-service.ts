/**
 * Enterprise Exchange Data Service
 * Centralized management for exchange data fetching, caching, and synchronization
 */

export interface ExchangeDataOptions {
  forceRefresh?: boolean;
  cacheOnly?: boolean;
  includeTypes?: DataType[];
}

export type DataType = "profile" | "merchant_profile" | "balance" | "payment_methods" | "orders" | "ads";

export interface ExchangeDataResult<T = any> {
  data: T | null;
  error: string | null;
  source: "cache" | "api" | "fallback";
  cached_at?: string;
  expires_at?: string;
  is_stale?: boolean;
}

export type DashboardBootstrapPayload = ClientDashboardBootstrapPayload;

export interface DataRefreshEvent {
  type: "refresh_started" | "refresh_completed" | "refresh_failed";
  exchange: string;
  dataTypes: DataType[];
  userId: string;
  timestamp: string;
  error?: string;
}

type CacheRecord = {
  data_type: DataType;
  data: any;
  created_at: string;
  expires_at: string;
};

export class ExchangeDataService {
  private static instance: ExchangeDataService | null = null;
  private refreshListeners: Set<(event: DataRefreshEvent) => void> = new Set();
  private refreshPromises: Map<string, Promise<any>> = new Map();
  private fetchPromises: Map<string, Promise<any>> = new Map();
  private cacheSnapshot: Map<string, { records: CacheRecord[]; expiresAt: number }> = new Map();

  static getInstance(): ExchangeDataService {
    if (!ExchangeDataService.instance) {
      ExchangeDataService.instance = new ExchangeDataService();
    }
    return ExchangeDataService.instance;
  }

  onRefresh(callback: (event: DataRefreshEvent) => void): () => void {
    this.refreshListeners.add(callback);
    return () => this.refreshListeners.delete(callback);
  }

  private emitRefreshEvent(event: DataRefreshEvent) {
    this.refreshListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in refresh event listener:", error);
      }
    });
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      credentials: "include",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || `Request failed with status ${response.status}`);
    }

    return payload as T;
  }

  async getDashboardBootstrap(
    exchange: string,
    includeTypes: DataType[]
  ): Promise<DashboardBootstrapPayload> {
    const payload = await getDashboardBootstrapCached({
      exchange,
      types: includeTypes,
      minimal: false,
      ttlMs: 10_000,
    });

    // Seed cache snapshot used by getCachedData to avoid extra round-trips.
    this.cacheSnapshot.set(`cache:${exchange}`, {
      records: (payload.exchange.records || []) as unknown as CacheRecord[],
      expiresAt: Date.now() + 10_000,
    });

    return payload;
  }

  async getExchangeData<T = any>(
    userId: string,
    exchange: string,
    dataType: DataType,
    options: ExchangeDataOptions = {}
  ): Promise<ExchangeDataResult<T>> {
    const { forceRefresh = false, cacheOnly = false } = options;
    const fetchKey = `${userId}-${exchange}-${dataType}`;

    try {
      if (!forceRefresh) {
        const cachedResult = await this.getCachedData<T>(exchange, dataType);
        if (cachedResult.data || cacheOnly) {
          return cachedResult;
        }
      }

      if (cacheOnly) {
        return {
          data: null,
          error: "No cached data available",
          source: "cache",
        };
      }

      if (this.fetchPromises.has(fetchKey)) {
        return await this.fetchPromises.get(fetchKey)!;
      }

      // Avoid expensive live API calls during page navigation.
      if (!forceRefresh) {
        return {
          data: null,
          error: "No cached data available",
          source: "cache",
        };
      }

      const fetchPromise = this.fetchFreshData<T>(exchange, dataType);
      this.fetchPromises.set(fetchKey, fetchPromise);

      try {
        return await fetchPromise;
      } finally {
        this.fetchPromises.delete(fetchKey);
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "fallback",
      };
    }
  }

  async refreshAllData(
    userId: string,
    exchange: string,
    options: ExchangeDataOptions = {}
  ): Promise<{ [key in DataType]?: ExchangeDataResult }> {
    const refreshKey = `${userId}-${exchange}`;

    if (this.refreshPromises.has(refreshKey)) {
      return await this.refreshPromises.get(refreshKey)!;
    }

    const refreshPromise = this.performFullRefresh(userId, exchange, options);
    this.refreshPromises.set(refreshKey, refreshPromise);

    try {
      return await refreshPromise;
    } finally {
      this.refreshPromises.delete(refreshKey);
    }
  }

  private async performFullRefresh(
    userId: string,
    exchange: string,
    options: ExchangeDataOptions
  ): Promise<{ [key in DataType]?: ExchangeDataResult }> {
    const dataTypes: DataType[] = options.includeTypes || ["profile", "merchant_profile", "balance", "payment_methods"];

    this.emitRefreshEvent({
      type: "refresh_started",
      exchange,
      dataTypes,
      userId,
      timestamp: new Date().toISOString(),
    });

    const results: { [key in DataType]?: ExchangeDataResult } = {};

    try {
      const fetchPromises = dataTypes.map(async (dataType) => {
        try {
          const result = await this.fetchDataFromAPI(dataType);
          await this.cacheData(exchange, dataType, result);

          results[dataType] = {
            data: result,
            error: null,
            source: "api",
          };
        } catch (error) {
          results[dataType] = {
            data: null,
            error: error instanceof Error ? error.message : "Unknown error",
            source: "api",
          };
        }
      });

      await Promise.all(fetchPromises);

      this.emitRefreshEvent({
        type: "refresh_completed",
        exchange,
        dataTypes,
        userId,
        timestamp: new Date().toISOString(),
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.emitRefreshEvent({
        type: "refresh_failed",
        exchange,
        dataTypes,
        userId,
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });
      throw error;
    }
  }

  private async getCachedData<T>(exchange: string, dataType: DataType): Promise<ExchangeDataResult<T>> {
    const snapshotKey = `cache:${exchange}`;
    const now = Date.now();
    const cachedSnapshot = this.cacheSnapshot.get(snapshotKey);

    let records: CacheRecord[];
    if (cachedSnapshot && cachedSnapshot.expiresAt > now) {
      records = cachedSnapshot.records;
    } else {
      const payload = await this.request<{ records: CacheRecord[] }>(
        `/api/okx/cache?exchange=${encodeURIComponent(exchange)}`
      );
      records = payload.records || [];
      this.cacheSnapshot.set(snapshotKey, {
        records,
        expiresAt: now + 5_000,
      });
    }

    const record = records.find((r) => r.data_type === dataType);
    if (!record) {
      return {
        data: null,
        error: "No cached data found",
        source: "cache",
      };
    }

    const current = new Date();
    const expiresAt = new Date(record.expires_at);

    return {
      data: record.data as T,
      error: null,
      source: "cache",
      cached_at: record.created_at,
      expires_at: record.expires_at,
      is_stale: current > expiresAt,
    };
  }

  private async fetchFreshData<T>(exchange: string, dataType: DataType): Promise<ExchangeDataResult<T>> {
    try {
      const freshData = await this.fetchDataFromAPI(dataType);
      await this.cacheData(exchange, dataType, freshData);

      return {
        data: freshData as T,
        error: null,
        source: "api",
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "api",
      };
    }
  }

  private async fetchDataFromAPI(dataType: DataType) {
    const actionMap: { [key in DataType]: string } = {
      profile: "user-info",
      merchant_profile: "merchant-profile",
      balance: "balances",
      payment_methods: "payment-methods",
      orders: "orders",
      ads: "ads",
    };

    const params = new URLSearchParams({ action: actionMap[dataType] });
    const response = await fetch(`/api/okx/data?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  private async cacheData(exchange: string, dataType: DataType, data: any) {
    const expirationMinutes: Record<DataType, number> = {
      profile: 60,
      merchant_profile: 60,
      balance: 15,
      payment_methods: 120,
      orders: 5,
      ads: 10,
    };

    const expiresAt = new Date(Date.now() + expirationMinutes[dataType] * 60 * 1000).toISOString();

    await this.request<{ success: boolean }>("/api/okx/cache", {
      method: "POST",
      body: JSON.stringify({
        exchange,
        dataType,
        data,
        expiresAt,
      }),
    });

    // Invalidate local snapshot cache after writes.
    this.cacheSnapshot.delete(`cache:${exchange}`);
    invalidateDashboardBootstrapCache();
  }

  async clearCache(_userId: string, exchange?: string, dataType?: DataType): Promise<void> {
    const params = new URLSearchParams();
    if (exchange) {
      params.set("exchange", exchange);
    }
    if (dataType) {
      params.set("dataType", dataType);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    await this.request<{ success: boolean }>(`/api/okx/cache${suffix}`, {
      method: "DELETE",
    });
    if (exchange) {
      this.cacheSnapshot.delete(`cache:${exchange}`);
    } else {
      this.cacheSnapshot.clear();
    }
    invalidateDashboardBootstrapCache();
  }

  async getDataStatus(
    _userId: string,
    exchange: string
  ): Promise<{ [key in DataType]?: { exists: boolean; isStale: boolean; expiresAt?: string } }> {
    const payload = await this.request<{ records: CacheRecord[] }>(
      `/api/okx/cache?exchange=${encodeURIComponent(exchange)}`
    );

    const status: { [key in DataType]?: { exists: boolean; isStale: boolean; expiresAt?: string } } = {};
    const now = new Date();
    const dataTypes: DataType[] = ["profile", "merchant_profile", "balance", "payment_methods", "orders", "ads"];

    dataTypes.forEach((type) => {
      const record = payload.records?.find((r) => r.data_type === type);
      if (!record) {
        status[type] = { exists: false, isStale: true };
        return;
      }

      status[type] = {
        exists: true,
        isStale: now > new Date(record.expires_at),
        expiresAt: record.expires_at,
      };
    });

    return status;
  }
}

export const exchangeDataService = ExchangeDataService.getInstance();
import {
  getDashboardBootstrapCached,
  type ClientDashboardBootstrapPayload,
  invalidateDashboardBootstrapCache,
} from "@/lib/client/dashboard-bootstrap-cache";
