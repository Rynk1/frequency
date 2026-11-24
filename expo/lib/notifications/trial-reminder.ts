import { PREMIUM_TRIAL_DAYS } from '../pricing';

export interface TrialReminder {
  fireAt: Date;
  title: string;
  body: string;
}

const REMINDER_LEAD_DAYS = 2;
const REMINDER_HOUR = 10;

/**
 * A trial reminder fires two days before the trial ends, which is day 5 of a
 * 7-day trial. It is scheduled at 10am local so it lands in the morning rather
 * than overnight.
 */
export function buildTrialReminder(
  nowMs: number = Date.now(),
  trialDays: number = PREMIUM_TRIAL_DAYS
): TrialReminder {
  const offsetDays = Math.max(0, trialDays - REMINDER_LEAD_DAYS);
  const fireAt = new Date(nowMs + offsetDays * 24 * 60 * 60 * 1000);
  fireAt.setHours(REMINDER_HOUR, 0, 0, 0);

  return {
    fireAt,
    title: `Your free trial ends in ${REMINDER_LEAD_DAYS} days`,
    body: 'Cancel before it ends if you do not want to continue. Your plan renews automatically.',
  };
}
