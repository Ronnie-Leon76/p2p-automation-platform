/**
 * Enterprise Exchange Data Service
 * Centralized management for exchange data fetching, caching, and synchronization
 */

import { decrypt } from "@/lib/crypto/encryption";
import { createClient } from "@/lib/supabase/client";

export interface ExchangeDataOptions {
  forceRefresh?: boolean;
  cacheOnly?: boolean;
  includeTypes?: DataType[];
}

export type DataType = 'profile' | 'merchant_profile' | 'balance' | 'payment_methods' | 'orders';

export interface ExchangeDataResult<T = any> {
  data: T | null;
  error: string | null;
  source: 'cache' | 'api' | 'fallback';
  cached_at?: string;
  expires_at?: string;
  is_stale?: boolean;
}

export interface DataRefreshEvent {
  type: 'refresh_started' | 'refresh_completed' | 'refresh_failed';
  exchange: string;
  dataTypes: DataType[];
  userId: string;
  timestamp: string;
  error?: string;
}

export class ExchangeDataService {
  private static instance: ExchangeDataService | null = null;
  private supabase = createClient();
  private refreshListeners: Set<(event: DataRefreshEvent) => void> = new Set();
  private refreshPromises: Map<string, Promise<any>> = new Map();
  private fetchPromises: Map<string, Promise<any>> = new Map(); // Add fetch deduplication

  static getInstance(): ExchangeDataService {
    if (!ExchangeDataService.instance) {
      ExchangeDataService.instance = new ExchangeDataService();
    }
    return ExchangeDataService.instance;
  }

  /**
   * Subscribe to data refresh events
   */
  onRefresh(callback: (event: DataRefreshEvent) => void): () => void {
    this.refreshListeners.add(callback);
    return () => this.refreshListeners.delete(callback);
  }

  /**
   * Emit refresh event to all listeners
   */
  private emitRefreshEvent(event: DataRefreshEvent) {
    this.refreshListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in refresh event listener:', error);
      }
    });
  }

  /**
   * Get exchange data with intelligent caching and request deduplication
   */
  async getExchangeData<T = any>(
    userId: string,
    exchange: string,
    dataType: DataType,
    options: ExchangeDataOptions = {}
  ): Promise<ExchangeDataResult<T>> {
    const { forceRefresh = false, cacheOnly = false } = options;
    const fetchKey = `${userId}-${exchange}-${dataType}`;

    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedResult = await this.getCachedData<T>(userId, exchange, dataType);
        if (cachedResult.data || cacheOnly) {
          return cachedResult;
        }
      }

      // Don't fetch if cache-only mode
      if (cacheOnly) {
        return {
          data: null,
          error: 'No cached data available',
          source: 'cache'
        };
      }

      // Check if there's already a pending fetch for this data
      if (this.fetchPromises.has(fetchKey)) {
        console.log(`🔄 Deduplicating request for ${dataType}`);
        return await this.fetchPromises.get(fetchKey)!;
      }

      // Fetch fresh data from API with deduplication
      const fetchPromise = this.fetchFreshData<T>(userId, exchange, dataType);
      this.fetchPromises.set(fetchKey, fetchPromise);

      try {
        const result = await fetchPromise;
        return result;
      } finally {
        this.fetchPromises.delete(fetchKey);
      }

    } catch (error) {
      console.error(`Error getting ${dataType} data:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'fallback'
      };
    }
  }

  /**
   * Refresh all exchange data for a user
   */
  async refreshAllData(
    userId: string, 
    exchange: string,
    options: ExchangeDataOptions = {}
  ): Promise<{[key in DataType]?: ExchangeDataResult}> {
    const refreshKey = `${userId}-${exchange}`;
    
    // Prevent duplicate refresh requests
    if (this.refreshPromises.has(refreshKey)) {
      return await this.refreshPromises.get(refreshKey)!;
    }

    const refreshPromise = this.performFullRefresh(userId, exchange, options);
    this.refreshPromises.set(refreshKey, refreshPromise);

    try {
      const result = await refreshPromise;
      return result;
    } finally {
      this.refreshPromises.delete(refreshKey);
    }
  }

  /**
   * Perform full data refresh
   */
  private async performFullRefresh(
    userId: string,
    exchange: string,
    options: ExchangeDataOptions
  ): Promise<{[key in DataType]?: ExchangeDataResult}> {
    const dataTypes: DataType[] = options.includeTypes || [
      'profile', 'merchant_profile', 'balance', 'payment_methods'
    ];

    this.emitRefreshEvent({
      type: 'refresh_started',
      exchange,
      dataTypes,
      userId,
      timestamp: new Date().toISOString()
    });

    const results: {[key in DataType]?: ExchangeDataResult} = {};

    try {
      // Get credentials
      const credentials = await this.getDecryptedCredentials(userId, exchange);
      if (!credentials) {
        throw new Error('No exchange credentials found');
      }

      // Fetch all data types in parallel
      const fetchPromises = dataTypes.map(async (dataType) => {
        try {
          const result = await this.fetchDataFromAPI(credentials, dataType);
          results[dataType] = {
            data: result,
            error: null,
            source: 'api'
          };

          // Cache the result
          await this.cacheData(userId, exchange, dataType, result);

        } catch (error) {
          console.error(`Error fetching ${dataType}:`, error);
          results[dataType] = {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: 'api'
          };
        }
      });

      await Promise.all(fetchPromises);

      this.emitRefreshEvent({
        type: 'refresh_completed',
        exchange,
        dataTypes,
        userId,
        timestamp: new Date().toISOString()
      });

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.emitRefreshEvent({
        type: 'refresh_failed',
        exchange,
        dataTypes,
        userId,
        timestamp: new Date().toISOString(),
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * Get cached data with staleness check
   */
  private async getCachedData<T>(
    userId: string,
    exchange: string,
    dataType: DataType
  ): Promise<ExchangeDataResult<T>> {
    const { data, error } = await this.supabase
      .from('user_exchange_data')
      .select('data, created_at, expires_at')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .eq('data_type', dataType)
      .single();

    if (error || !data) {
      return {
        data: null,
        error: 'No cached data found',
        source: 'cache'
      };
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    const isStale = now > expiresAt;

    return {
      data: data.data as T,
      error: null,
      source: 'cache',
      cached_at: data.created_at,
      expires_at: data.expires_at,
      is_stale: isStale
    };
  }

  /**
   * Fetch fresh data from API
   */
  private async fetchFreshData<T>(
    userId: string,
    exchange: string,
    dataType: DataType
  ): Promise<ExchangeDataResult<T>> {
    const credentials = await this.getDecryptedCredentials(userId, exchange);
    if (!credentials) {
      return {
        data: null,
        error: 'No exchange credentials found',
        source: 'api'
      };
    }

    try {
      const freshData = await this.fetchDataFromAPI(credentials, dataType);
      
      // Cache the fresh data
      await this.cacheData(userId, exchange, dataType, freshData);

      return {
        data: freshData as T,
        error: null,
        source: 'api'
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'api'
      };
    }
  }

  /**
   * Get decrypted credentials for a user
   */
  private async getDecryptedCredentials(userId: string, exchange: string) {
    const { data, error } = await this.supabase
      .from('exchange_credentials')
      .select('api_key, api_secret, passphrase')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      apiKey: decrypt(data.api_key),
      apiSecret: decrypt(data.api_secret),
      passphrase: decrypt(data.passphrase)
    };
  }

  /**
   * Fetch data from exchange API using GET requests (proper RESTful approach)
   */
  private async fetchDataFromAPI(credentials: any, dataType: DataType) {
    const actionMap: {[key in DataType]: string} = {
      'profile': 'user-info',
      'merchant_profile': 'merchant-profile',
      'balance': 'balances',
      'payment_methods': 'payment-methods',
      'orders': 'orders'
    };

    // Build query parameters for GET request
    const params = new URLSearchParams({
      action: actionMap[dataType]
    });

    const response = await fetch(`/api/okx/data?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Cache data with appropriate expiration
   */
  private async cacheData(
    userId: string,
    exchange: string,
    dataType: DataType,
    data: any
  ) {
    // Set different expiration times based on data type
    const expirationMinutes = {
      'profile': 60,           // 1 hour
      'merchant_profile': 60,  // 1 hour
      'balance': 15,           // 15 minutes
      'payment_methods': 120,  // 2 hours
      'orders': 5              // 5 minutes
    };

    const expiresAt = new Date(
      Date.now() + (expirationMinutes[dataType] * 60 * 1000)
    ).toISOString();

    await this.supabase
      .from('user_exchange_data')
      .upsert({
        user_id: userId,
        exchange,
        data_type: dataType,
        data,
        expires_at: expiresAt
      });
  }

  /**
   * Clear cached data
   */
  async clearCache(
    userId: string,
    exchange?: string,
    dataType?: DataType
  ): Promise<void> {
    let query = this.supabase
      .from('user_exchange_data')
      .delete()
      .eq('user_id', userId);

    if (exchange) {
      query = query.eq('exchange', exchange);
    }

    if (dataType) {
      query = query.eq('data_type', dataType);
    }

    await query;
  }

  /**
   * Get data freshness status
   */
  async getDataStatus(
    userId: string,
    exchange: string
  ): Promise<{[key in DataType]?: { exists: boolean; isStale: boolean; expiresAt?: string }}> {
    const { data } = await this.supabase
      .from('user_exchange_data')
      .select('data_type, expires_at')
      .eq('user_id', userId)
      .eq('exchange', exchange);

    const status: {[key in DataType]?: { exists: boolean; isStale: boolean; expiresAt?: string }} = {};
    const now = new Date();

    const dataTypes: DataType[] = ['profile', 'merchant_profile', 'balance', 'payment_methods', 'orders'];
    
    dataTypes.forEach(type => {
      const record = data?.find(d => d.data_type === type);
      if (record) {
        const isStale = now > new Date(record.expires_at);
        status[type] = {
          exists: true,
          isStale,
          expiresAt: record.expires_at
        };
      } else {
        status[type] = {
          exists: false,
          isStale: true
        };
      }
    });

    return status;
  }
}

// Singleton instance
export const exchangeDataService = ExchangeDataService.getInstance();
