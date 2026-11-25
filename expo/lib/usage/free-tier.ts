import { CANONICAL_PREMIUM_POLICY } from './PremiumPolicy';

export interface FreeDurationContext {
  isSleep: boolean;
  sleepLongUsed: boolean;
}

export function freeDurationLimitMinutes(context: FreeDurationContext): number {
  if (context.isSleep && !context.sleepLongUsed) {
    return Math.floor(CANONICAL_PREMIUM_POLICY.freeSleepSessionMaxDuration / 60);
  }
  return Math.floor(CANONICAL_PREMIUM_POLICY.freeSessionMaxDuration / 60);
}

export function canUseLongSleepSession(context: FreeDurationContext): boolean {
  return context.isSleep && !context.sleepLongUsed;
}
