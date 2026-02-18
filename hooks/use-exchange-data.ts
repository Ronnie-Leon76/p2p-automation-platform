/**
 * React Hook for Exchange Data Management
 * Provides reactive data state with automatic refresh capabilities
 */

import { DataRefreshEvent, DataType, ExchangeDataResult, exchangeDataService } from '@/lib/services/exchange-data-service';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UseExchangeDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  includeTypes?: DataType[];
  onRefreshStart?: () => void;
  onRefreshComplete?: () => void;
  onRefreshError?: (error: string) => void;
}

export interface ExchangeDataState {
  profile: ExchangeDataResult | null;
  merchantProfile: ExchangeDataResult | null;
  balance: ExchangeDataResult | null;
  paymentMethods: ExchangeDataResult | null;
  orders: ExchangeDataResult | null;
  ads: ExchangeDataResult | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefresh: string | null;
  errors: Record<DataType, string | null>;
}

export function useExchangeData(
  userId: string | null,
  exchange: string = 'okx',
  options: UseExchangeDataOptions = {}
) {
  const {
    autoRefresh = false,
    refreshInterval = 30, // 30 minutes default
    includeTypes = ['profile', 'merchant_profile', 'balance', 'payment_methods'],
    onRefreshStart,
    onRefreshComplete,
    onRefreshError
  } = options;

  const [state, setState] = useState<ExchangeDataState>({
    profile: null,
    merchantProfile: null,
    balance: null,
    paymentMethods: null,
    orders: null,
    ads: null,
    isLoading: false,
    isRefreshing: false,
    lastRefresh: null,
    errors: {
      profile: null,
      merchant_profile: null,
      balance: null,
      payment_methods: null,
      orders: null,
      ads: null
    }
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const loadingRef = useRef<boolean>(false); // Prevent concurrent loads
  const lastLoadTimeRef = useRef<number>(0); // Debounce mechanism
  const refreshDataRef = useRef<(() => Promise<void>) | null>(null); // Stable ref for interval

  // Stabilize includeTypes to prevent infinite re-renders
  const stableIncludeTypes = useMemo(() => includeTypes, [JSON.stringify(includeTypes)]);

  /**
   * Load initial data with deduplication and debouncing
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    console.log('🔍 loadData called', { userId, forceRefresh, loading: loadingRef.current });
    
    if (!userId || loadingRef.current) {
      console.log('⏭️ Skipping loadData - no user or already loading');
      return; // Skip if no user or already loading
    }

    // Debounce: prevent calls within 1 second
    const now = Date.now();
    if (!forceRefresh && now - lastLoadTimeRef.current < 1000) {
      console.log('⏭️ Skipping loadData - debounced');
      return;
    }
    
    console.log('✅ Starting loadData execution');
    lastLoadTimeRef.current = now;
    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const results = await Promise.all(
        stableIncludeTypes.map(async (dataType) => {
          const result = await exchangeDataService.getExchangeData(
            userId,
            exchange,
            dataType,
            { forceRefresh }
          );
          return { dataType, result };
        })
      );

      setState(prev => {
        const newState = { ...prev, isLoading: false };
        const newErrors = { ...prev.errors };

        results.forEach(({ dataType, result }) => {
          const stateKey = dataType === 'merchant_profile' ? 'merchantProfile' : 
                          dataType === 'payment_methods' ? 'paymentMethods' : 
                          dataType === 'ads' ? 'ads' : dataType;
          
          (newState as any)[stateKey] = result;
          newErrors[dataType] = result.error;
        });

        newState.errors = newErrors;
        return newState;
      });

      console.log('✅ loadData completed successfully');

    } catch (error) {
      console.error('❌ loadData failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        errors: {
          ...prev.errors,
          profile: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [userId, exchange, stableIncludeTypes]); // Use stable includeTypes

  /**
   * Refresh all data with deduplication
   */
  const refreshData = useCallback(async () => {
    if (!userId || loadingRef.current) {
      return; // Skip if no user or already loading
    }

    loadingRef.current = true;
    setState(prev => ({ ...prev, isRefreshing: true }));
    onRefreshStart?.();

    try {
      const results = await exchangeDataService.refreshAllData(userId, exchange, {
        includeTypes: stableIncludeTypes
      });

      setState(prev => {
        const newState = { 
          ...prev, 
          isRefreshing: false,
          lastRefresh: new Date().toISOString()
        };
        const newErrors = { ...prev.errors };

        Object.entries(results).forEach(([dataType, result]) => {
          if (result) {
            const stateKey = dataType === 'merchant_profile' ? 'merchantProfile' : 
                            dataType === 'payment_methods' ? 'paymentMethods' : 
                            dataType === 'ads' ? 'ads' : dataType;
            
            (newState as any)[stateKey] = result;
            newErrors[dataType as DataType] = result.error;
          }
        });

        newState.errors = newErrors;
        return newState;
      });

      onRefreshComplete?.();

    } catch (error) {
      setState(prev => ({ ...prev, isRefreshing: false }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onRefreshError?.(errorMessage);
    } finally {
      loadingRef.current = false;
    }
  }, [userId, exchange, stableIncludeTypes, onRefreshStart, onRefreshComplete, onRefreshError]);

  /**
   * Refresh specific data type
   */
  const refreshDataType = useCallback(async (dataType: DataType) => {
    if (!userId) return;

    try {
      const result = await exchangeDataService.getExchangeData(
        userId,
        exchange,
        dataType,
        { forceRefresh: true }
      );

      setState(prev => {
        const stateKey = dataType === 'merchant_profile' ? 'merchantProfile' : 
                        dataType === 'payment_methods' ? 'paymentMethods' : 
                        dataType === 'ads' ? 'ads' : dataType;
        
        return {
          ...prev,
          [stateKey]: result,
          errors: {
            ...prev.errors,
            [dataType]: result.error
          }
        };
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [dataType]: errorMessage
        }
      }));
      throw error;
    }
  }, [userId, exchange]);

  /**
   * Clear cache and reload - using stable reference
   */
  const clearCacheAndReload = useCallback(async () => {
    if (!userId) return;

    await exchangeDataService.clearCache(userId, exchange);
    // Call loadData directly without dependency to prevent infinite loops
    if (!loadingRef.current) {
      const now = Date.now();
      lastLoadTimeRef.current = now;
      loadingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true }));

      try {
        const results = await Promise.all(
          stableIncludeTypes.map(async (dataType) => {
            const result = await exchangeDataService.getExchangeData(
              userId,
              exchange,
              dataType,
              { forceRefresh: true }
            );
            return { dataType, result };
          })
        );

        setState(prev => {
          const newState = { ...prev, isLoading: false };
          const newErrors = { ...prev.errors };

          results.forEach(({ dataType, result }) => {
            const stateKey = dataType === 'merchant_profile' ? 'merchantProfile' : 
                            dataType === 'payment_methods' ? 'paymentMethods' : 
                            dataType === 'ads' ? 'ads' : dataType;
            
            (newState as any)[stateKey] = result;
            newErrors[dataType] = result.error;
          });

          newState.errors = newErrors;
          return newState;
        });

      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          errors: {
            ...prev.errors,
            profile: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      } finally {
        loadingRef.current = false;
      }
    }
  }, [userId, exchange, stableIncludeTypes]);

  /**
   * Get data status
   */
  const getDataStatus = useCallback(async () => {
    if (!userId) return null;
    return await exchangeDataService.getDataStatus(userId, exchange);
  }, [userId, exchange]);

  // Subscribe to refresh events
  useEffect(() => {
    const handleRefreshEvent = (event: DataRefreshEvent) => {
      if (event.userId === userId && event.exchange === exchange) {
        if (event.type === 'refresh_started') {
          setState(prev => ({ ...prev, isRefreshing: true }));
        } else if (event.type === 'refresh_completed') {
          setState(prev => ({ 
            ...prev, 
            isRefreshing: false,
            lastRefresh: event.timestamp
          }));
        } else if (event.type === 'refresh_failed') {
          setState(prev => ({ ...prev, isRefreshing: false }));
        }
      }
    };

    unsubscribeRef.current = exchangeDataService.onRefresh(handleRefreshEvent);

    return () => {
      unsubscribeRef.current?.();
    };
  }, [userId, exchange]);

  // Store refreshData in ref for stable access
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  // Auto-refresh setup with stable reference
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && userId) {
      const intervalMs = refreshInterval * 60 * 1000;
      
      // Clear any existing interval
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setInterval(() => {
        // Use stable ref to prevent infinite loops
        if (!loadingRef.current && refreshDataRef.current) {
          refreshDataRef.current();
        }
      }, intervalMs);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, userId]); // Stable dependencies only

  // Load initial data once with request deduplication
  useEffect(() => {
    console.log('🎯 Initial load effect triggered', { userId, exchange, loading: loadingRef.current });
    let mounted = true;
    
    if (userId && !loadingRef.current && mounted) {
      console.log('🚀 Initial data load triggered for user:', userId);
      loadData();
    }

    return () => {
      console.log('🧹 Initial load effect cleanup');
      mounted = false;
    };
  }, [userId, exchange]); // Minimal stable dependencies only

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
      unsubscribeRef.current?.();
    };
  }, []);

  return {
    ...state,
    refreshData,
    refreshDataType,
    clearCacheAndReload,
    getDataStatus,
    loadData: () => loadData(false),
    forceReload: () => loadData(true)
  };
}
