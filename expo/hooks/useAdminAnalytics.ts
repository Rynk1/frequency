import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDataMode } from './useDataMode';
import {
  AdminAnalyticsData,
  fetchAdminAnalyticsFromFirestore,
  DataHealthInfo,
} from '@/lib/admin-analytics';
import { useBackendData } from './useBackendData';

interface AdminAnalyticsState {
  analytics: AdminAnalyticsData | null;
  isLoading: boolean;
  refreshing: boolean;
  lastUpdated: Date | null;
  refreshAnalytics: () => Promise<void>;
}

const createUnavailableAnalytics = (
  modeLabel: string,
  connectionStatus: 'unavailable' | 'local_mode',
  errorMessage: string | null,
  localContent?: { frequencies: number; curatedPrograms: number; articles: number }
): AdminAnalyticsData => {
  const now = new Date();
  const isLocal = connectionStatus === 'local_mode';

  return {
    dataHealth: {
      source: isLocal ? 'Local Mode (Explicit Selection)' : 'Cloud Data Unavailable',
      connectionStatus,
      lastSuccessfulFetch: null,
      lastClientRefresh: now,
      isStale: true,
      errorMessage,
    },
    users: {
      totalMembers: 0,
      premium: {
        profilePremiumUsers: 0,
        activeEntitlements: 0,
        verifiedSubscriptions: 0,
        trialUsers: 0,
        freeUsers: 0,
      },
    },
    content: {
      frequencies: localContent?.frequencies ?? 0,
      curatedPrograms: localContent?.curatedPrograms ?? 0,
      articles: localContent?.articles ?? 0,
    },
    engagement: {
      totalListeningMinutes: 0,
      totalSessionsCompleted: 0,
      topStreakDays: 0,
      activeUsers: null,
      activeUsersReason: 'Active users metric is omitted pending a canonical product specification definition.',
    },
    rankings: {
      frequencies: [],
      programmes: [],
    },
    financial: {
      monthlyRevenue: null,
      yearlyRevenue: null,
      revenueNote: 'Revenue data requires provider financial reconciliation endpoint.',
      paymentCount: null,
      recentPayments: [],
    },
    audit: {
      recentLogs: [],
    },
  };
};

export const [AdminAnalyticsProvider, useAdminAnalytics] = createContextHook<AdminAnalyticsState>(() => {
  const { shouldUseFirestore, isCloudStrict, isLocalOnly, modeLabel, setCloudError } = useDataMode();
  const { frequencies, curatedPrograms, articles } = useBackendData();
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAnalytics = useCallback(async () => {
    // LOCAL MODE (explicit)
    if (isLocalOnly) {
      setIsLoading(true);
      const localData = createUnavailableAnalytics(
        modeLabel,
        'local_mode',
        'Local mode is explicitly selected. Operational cloud analytics are unavailable.',
        {
          frequencies: frequencies.length,
          curatedPrograms: curatedPrograms.length,
          articles: articles.length,
        }
      );
      setAnalytics(localData);
      setLastUpdated(new Date());
      setIsLoading(false);
      return;
    }

    // CLOUD or AUTO MODE
    try {
      setIsLoading(true);
      const data = await fetchAdminAnalyticsFromFirestore();
      setAnalytics(data);
      setLastUpdated(new Date());
      setCloudError(null);
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch cloud analytics';
      console.warn('❌ Admin Analytics Cloud Fetch Error:', msg);
      setCloudError(msg);

      if (isCloudStrict) {
        // Cloud Strict mode fails hard and displays error
        setAnalytics(
          createUnavailableAnalytics(modeLabel, 'unavailable', `Cloud Mode Error: ${msg}`)
        );
      } else {
        // Auto mode: Displays unavailable operational state (does NOT invent local metrics)
        setAnalytics(
          createUnavailableAnalytics(
            modeLabel,
            'unavailable',
            `Cloud Unavailable: ${msg}. Displaying stale/unavailable status.`
          )
        );
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isLocalOnly, modeLabel, frequencies.length, curatedPrograms.length, articles.length, setCloudError, isCloudStrict]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Periodic polling every 60 seconds (snap-based refresh, not real-time stream)
  useEffect(() => {
    if (isLocalOnly) return;
    const interval = setInterval(() => {
      loadAnalytics();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAnalytics, isLocalOnly]);

  const refreshAnalytics = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
  }, [loadAnalytics]);

  return useMemo(() => ({
    analytics,
    isLoading,
    refreshing,
    lastUpdated,
    refreshAnalytics,
  }), [analytics, isLoading, refreshing, lastUpdated, refreshAnalytics]);
});
