// hooks/use-activity-logs.ts
// React hook for optimized activity logs with performance monitoring

'use client';

import { ActivityLog, activityLogsService, CreateActivityLogInput } from '@/lib/database/activity-logs';
import { useCallback, useEffect, useState } from 'react';
import { useMockAuth } from './use-mock-auth';

interface UseActivityLogsOptions {
  teamId?: string;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ActivityLogsState {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
}

export function useActivityLogs(options: UseActivityLogsOptions = {}) {
  const { user } = useMockAuth();
  const { teamId, userId, autoRefresh = false, refreshInterval = 30000 } = options;

  const [state, setState] = useState<ActivityLogsState>({
    logs: [],
    loading: false,
    error: null,
    hasMore: false,
    total: 0
  });

  const [page, setPage] = useState(0);
  const pageSize = 50;

  /**
   * Load activity logs with pagination
   */
  const loadLogs = useCallback(async (reset = false) => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const currentPage = reset ? 0 : page;
      const offset = currentPage * pageSize;

      let result;

      if (teamId) {
        // Load team activity logs
        result = await activityLogsService.getTeamActivityLogs(teamId, {
          limit: pageSize,
          offset,
          userId: userId
        });
      } else {
        // Load user activity logs
        const targetUserId = userId || user.id;
        result = await activityLogsService.getUserActivityLogs(targetUserId, {
          limit: pageSize,
          offset
        });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      const hasMore = result.count ? offset + pageSize < result.count : false;

      setState(prev => ({
        ...prev,
        logs: reset ? (result.data || []) as ActivityLog[] : [...prev.logs, ...(result.data || []) as ActivityLog[]],
        loading: false,
        hasMore,
        total: result.count || 0
      }));

      if (reset) {
        setPage(0);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load activity logs'
      }));
    }
  }, [user, teamId, userId, page, pageSize]);

  /**
   * Load more logs (pagination)
   */
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.loading) {
      setPage(prev => prev + 1);
    }
  }, [state.hasMore, state.loading]);

  /**
   * Refresh logs
   */
  const refresh = useCallback(() => {
    loadLogs(true);
  }, [loadLogs]);

  /**
   * Create new activity log
   */
  const createLog = useCallback(async (log: Omit<CreateActivityLogInput, 'user_id' | 'team_id'>) => {
    if (!user?.id) return;

    // For mock auth, use a default team_id or the user's id as team_id
    const teamIdToUse = teamId || user.id;

    const fullLog: CreateActivityLogInput = {
      ...log,
      user_id: user.id,
      team_id: teamIdToUse
    };

    const result = await activityLogsService.createActivityLog(fullLog);
    
    if (!result.error) {
      // Refresh logs to show the new entry
      refresh();
    }

    return result;
  }, [user, teamId, refresh]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadLogs(true);
    }
  }, [user, teamId, userId]);

  // Load more when page changes
  useEffect(() => {
    if (page > 0) {
      loadLogs(false);
    }
  }, [page]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    ...state,
    loadMore,
    refresh,
    createLog,
    canLoadMore: state.hasMore && !state.loading
  };
}

/**
 * Hook for activity summary dashboard widget
 */
export function useActivitySummary(teamId?: string, daysBack = 7) {
  const { user } = useMockAuth();
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!teamId || !user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await activityLogsService.getActivitySummary(teamId, daysBack);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      setSummary(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity summary');
    } finally {
      setLoading(false);
    }
  }, [teamId, daysBack, user]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary
  };
}
