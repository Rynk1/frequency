import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { DEFAULT_PREMIUM_POLICY } from '@/lib/subscription-service';
import {
  readSessionLedger,
  writeSessionLedger,
  normalizeLedger,
  localDateKey,
  remainingStarts,
  type SessionLedger,
} from '@/lib/usage/SessionLedger';
import { canUseLongSleepSession, freeDurationLimitMinutes } from '@/lib/usage/free-tier';

interface PremiumUsageConfig {
  freeSessionsPerDay: number;
  freeSessionDuration: number; // in minutes
  freeSleepSessionDuration: number; // in minutes, one per day
  premiumFeatures: string[];
}

const DEFAULT_CONFIG: PremiumUsageConfig = {
  freeSessionsPerDay: DEFAULT_PREMIUM_POLICY.dailyFreeSessionsLimit,
  freeSessionDuration: Math.floor(DEFAULT_PREMIUM_POLICY.freeSessionMaxDuration / 60),
  freeSleepSessionDuration: Math.floor(DEFAULT_PREMIUM_POLICY.freeSleepSessionMaxDuration / 60),
  premiumFeatures: [
    'Extended Sessions',
    'Premium Frequencies',
    'Binaural Beats',
    'Progress Analytics',
  ],
};

export const usePremiumUsage = (config: Partial<PremiumUsageConfig> = {}) => {
  const { userProfile, isPremium, isTrialActive } = useAuth();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [gateConfig, setGateConfig] = useState<{
    feature: string;
    description: string;
    icon?: any;
  }>({ feature: '', description: '' });

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Free-tier usage is tracked locally per calendar day so the limit holds even
  // when a session is abandoned before completion or the device is offline.
  const [ledger, setLedger] = useState<SessionLedger>(() => normalizeLedger(null));

  useEffect(() => {
    let mounted = true;
    readSessionLedger().then((stored) => {
      if (mounted) setLedger(stored);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const getTodaySessionCount = useCallback(() => {
    if (isPremium || isTrialActive) return 0;
    return normalizeLedger(ledger).starts;
  }, [isPremium, isTrialActive, ledger]);

  const canStartSession = useCallback(() => {
    if (isPremium || isTrialActive) return true;
    return getTodaySessionCount() < finalConfig.freeSessionsPerDay;
  }, [isPremium, isTrialActive, getTodaySessionCount, finalConfig.freeSessionsPerDay]);

  const getRemainingFreeSessions = useCallback(() => {
    if (isPremium || isTrialActive) return Infinity;
    return remainingStarts(normalizeLedger(ledger), finalConfig.freeSessionsPerDay);
  }, [isPremium, isTrialActive, ledger, finalConfig.freeSessionsPerDay]);

  const recordSessionStart = useCallback(async () => {
    if (isPremium || isTrialActive) return;
    const current = await readSessionLedger();
    const next: SessionLedger = {
      date: localDateKey(),
      starts: current.starts + 1,
      sleepLongStarts: current.sleepLongStarts || 0,
    };
    await writeSessionLedger(next);
    setLedger(next);
  }, [isPremium, isTrialActive]);

  const getMaxSessionDuration = useCallback((isSleep = false) => {
    if (isPremium || isTrialActive) return Infinity;
    return freeDurationLimitMinutes({ isSleep, sleepLongUsed: false });
  }, [isPremium, isTrialActive]);

  const checkFeatureAccess = useCallback((feature: string): boolean => {
    if (!feature?.trim()) return false;
    if (isPremium || isTrialActive) return true;
    return !finalConfig.premiumFeatures.includes(feature.trim());
  }, [isPremium, isTrialActive, finalConfig.premiumFeatures]);

  const showPremiumGateForFeature = useCallback((
    feature: string,
    description: string,
    icon?: any
  ) => {
    setGateConfig({ feature, description, icon });
    setShowPremiumGate(true);
  }, []);

  const showSessionLimitGate = useCallback(() => {
    showPremiumGateForFeature(
      'Daily Session Limit Reached',
      `You've used all ${finalConfig.freeSessionsPerDay} free sessions today. Upgrade to enjoy unlimited sessions and transform your wellness journey.`
    );
  }, [finalConfig.freeSessionsPerDay, showPremiumGateForFeature]);

  const showDurationLimitGate = useCallback(() => {
    showPremiumGateForFeature(
      'Extended Session Duration',
      `Free users can enjoy ${finalConfig.freeSessionDuration}-minute sessions. Upgrade for unlimited session lengths and deeper meditation experiences.`
    );
  }, [finalConfig.freeSessionDuration, showPremiumGateForFeature]);

  /**
   * Authorises a session start and consumes one free session from the daily
   * allowance. Callers must await this before starting playback and must
   * present the appropriate gate when `allowed` is false — the hook only
   * decides, so presentation stays with whichever screen owns the modal.
   */
  const attemptStartSession = useCallback(async (
    frequency: string,
    durationMinutes: number,
    options: { isSleep?: boolean; isPreview?: boolean } = {}
  ): Promise<{ allowed: boolean; reason?: 'invalid_frequency' | 'session_limit' | 'duration_limit'; maxDurationMinutes?: number }> => {
    if (!frequency?.trim()) {
      return { allowed: false, reason: 'invalid_frequency' };
    }

    if (!isPremium && !isTrialActive) {
      const current = await readSessionLedger();
      const normalized = normalizeLedger(current);
      const longSleep = canUseLongSleepSession({
        isSleep: Boolean(options.isSleep),
        sleepLongUsed: normalized.sleepLongStarts > 0,
      });
      const maxDuration = freeDurationLimitMinutes({
        isSleep: Boolean(options.isSleep),
        sleepLongUsed: normalized.sleepLongStarts > 0,
      });

      if (normalized.starts >= finalConfig.freeSessionsPerDay) {
        setLedger(normalized);
        return {
          allowed: false,
          reason: 'session_limit',
          maxDurationMinutes: maxDuration,
        };
      }

      if (durationMinutes > maxDuration) {
        return {
          allowed: false,
          reason: 'duration_limit',
          maxDurationMinutes: maxDuration,
        };
      }

      if (!options.isPreview) {
        const next: SessionLedger = {
          date: localDateKey(),
          starts: normalized.starts + 1,
          sleepLongStarts:
            normalized.sleepLongStarts +
            (longSleep && durationMinutes > finalConfig.freeSessionDuration ? 1 : 0),
        };
        await writeSessionLedger(next);
        setLedger(next);
      }
    }

    return { allowed: true };
  }, [
    isPremium,
    isTrialActive,
    finalConfig.freeSessionsPerDay,
    finalConfig.freeSessionDuration,
  ]);

  const attemptFeatureAccess = useCallback((
    feature: string,
    description?: string,
    icon?: any
  ): boolean => {
    if (!feature?.trim()) return false;

    if (checkFeatureAccess(feature.trim())) {
      return true;
    }

    showPremiumGateForFeature(
      feature.trim(),
      description || `${feature.trim()} is a premium feature. Upgrade to unlock the full library and longer sessions.`,
      icon
    );

    return false;
  }, [checkFeatureAccess, showPremiumGateForFeature]);

  const getUsageStats = useCallback(() => {
    const todayCount = getTodaySessionCount();
    const remaining = getRemainingFreeSessions();
    const maxDuration = getMaxSessionDuration();

    return {
      todaySessionCount: todayCount,
      remainingFreeSessions: remaining,
      maxSessionDuration: maxDuration,
      totalSessions: userProfile?.usageStats.sessionsCompleted || 0,
      totalListeningTime: userProfile?.usageStats.totalListeningTime || 0,
      streakDays: userProfile?.usageStats.streakDays || 0,
      isPremium,
      isTrialActive,
    };
  }, [
    getTodaySessionCount,
    getRemainingFreeSessions,
    getMaxSessionDuration,
    userProfile,
    isPremium,
    isTrialActive,
  ]);

  const closePremiumGate = useCallback(() => {
    setShowPremiumGate(false);
  }, []);

  return {
    // Usage checks
    canStartSession,
    checkFeatureAccess,
    getRemainingFreeSessions,
    getMaxSessionDuration,
    getUsageStats,
    recordSessionStart,

    // Actions
    attemptStartSession,
    attemptFeatureAccess,

    // Premium gate
    showPremiumGate,
    gateConfig,
    closePremiumGate,
    showPremiumGateForFeature,

    // Quick access gates
    showSessionLimitGate,
    showDurationLimitGate,
  };
};
