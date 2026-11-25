export const WEEKLY_FREEZE_LIMIT = 2;

export interface StreakFreezeResult {
  streakDays: number;
  freezesUsed: number;
  usedFreeze: boolean;
}

/**
 * A freeze covers one missed day. Two are available each week, for free and
 * premium listeners alike. A gap larger than the remaining freezes resets the
 * streak rather than pretending it survived.
 */
export function resolveStreakWithFreezes(params: {
  streakDays: number;
  daysSinceLastSession: number;
  freezesUsed: number;
  limit?: number;
}): StreakFreezeResult {
  const { streakDays, daysSinceLastSession } = params;
  const limit = params.limit ?? WEEKLY_FREEZE_LIMIT;
  const used = Math.max(0, Math.min(params.freezesUsed, limit));

  if (daysSinceLastSession <= 0) {
    return { streakDays: Math.max(1, streakDays), freezesUsed: used, usedFreeze: false };
  }
  if (daysSinceLastSession === 1) {
    return { streakDays: streakDays + 1, freezesUsed: used, usedFreeze: false };
  }

  const missedDays = daysSinceLastSession - 1;
  const available = Math.max(0, limit - used);
  if (missedDays <= available) {
    return { streakDays: streakDays + 1, freezesUsed: used + missedDays, usedFreeze: true };
  }

  return { streakDays: 1, freezesUsed: 0, usedFreeze: false };
}

export function freezesLeft(freezesUsed: number, limit: number = WEEKLY_FREEZE_LIMIT): number {
  return Math.max(0, limit - Math.max(0, freezesUsed));
}
