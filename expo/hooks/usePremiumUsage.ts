import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface PremiumUsageConfig {
  freeSessionsPerDay: number;
  freeSessionDuration: number; // in minutes
  premiumFeatures: string[];
}

const DEFAULT_CONFIG: PremiumUsageConfig = {
  freeSessionsPerDay: 3,
  freeSessionDuration: 10,
  premiumFeatures: [
    'Extended Sessions',
    'Premium Frequencies',
    'Binaural Beats',
    'Custom Mixing',
    'Offline Downloads',
    'Progress Analytics',
  ],
};

export const usePremiumUsage = (config: Partial<PremiumUsageConfig> = {}) => {
  const { userProfile, isPremium, isTrialActive, trackUsage } = useAuth();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [gateConfig, setGateConfig] = useState<{
    feature: string;
    description: string;
    icon?: any;
  }>({ feature: '', description: '' });

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const getTodaySessionCount = useCallback(() => {
    if (!userProfile) return 0;
    
    const today = new Date();
    const lastSessionDate = userProfile.usageStats.lastSessionDate;
    
    if (!lastSessionDate) return 0;
    
    const isToday = 
      lastSessionDate.getDate() === today.getDate() &&
      lastSessionDate.getMonth() === today.getMonth() &&
      lastSessionDate.getFullYear() === today.getFullYear();
    
    return isToday ? userProfile.usageStats.sessionsCompleted : 0;
  }, [userProfile]);

  const canStartSession = useCallback(() => {
    if (isPremium || isTrialActive) return true;
    
    const todayCount = getTodaySessionCount();
    return todayCount < finalConfig.freeSessionsPerDay;
  }, [isPremium, isTrialActive, getTodaySessionCount, finalConfig.freeSessionsPerDay]);

  const getRemainingFreeSessions = useCallback(() => {
    if (isPremium || isTrialActive) return Infinity;
    
    const todayCount = getTodaySessionCount();
    return Math.max(0, finalConfig.freeSessionsPerDay - todayCount);
  }, [isPremium, isTrialActive, getTodaySessionCount, finalConfig.freeSessionsPerDay]);

  const getMaxSessionDuration = useCallback(() => {
    if (isPremium || isTrialActive) return Infinity;
    return finalConfig.freeSessionDuration;
  }, [isPremium, isTrialActive, finalConfig.freeSessionDuration]);

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

  const attemptStartSession = useCallback(async (
    frequency: string,
    duration: number
  ): Promise<{ allowed: boolean; reason?: string }> => {
    if (!frequency?.trim()) {
      return { allowed: false, reason: 'invalid_frequency' };
    }
    
    // Check session limit
    if (!canStartSession()) {
      showSessionLimitGate();
      return { allowed: false, reason: 'session_limit' };
    }

    // Check duration limit
    if (duration > getMaxSessionDuration()) {
      showDurationLimitGate();
      return { allowed: false, reason: 'duration_limit' };
    }

    // Track the session start
    await trackUsage(0, frequency.trim()); // Duration will be updated when session ends
    
    return { allowed: true };
  }, [
    canStartSession,
    getMaxSessionDuration,
    showSessionLimitGate,
    showDurationLimitGate,
    trackUsage,
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
      description || `${feature.trim()} is a premium feature. Upgrade to unlock advanced capabilities and enhance your frequency healing experience.`,
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