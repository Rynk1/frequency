import type { IntentCategoryId } from '@/lib/catalogue/intent-taxonomy';

export interface PaywallCopy {
  headline: string;
  body: string;
}

/**
 * The paywall should name the need the listener arrived with. It must not
 * promise programs or tracks that are not actually gated, so the body copy
 * stays on the full library and full session length.
 */
export const PAYWALL_INTENT_COPY: Record<IntentCategoryId, PaywallCopy> = {
  sleep: {
    headline: "Make tonight's wind-down a routine",
    body: 'Full-length sleep sessions and the full library. Free for 7 days, then choose a plan.',
  },
  calm: {
    headline: 'A calmer pause, whenever you need one',
    body: 'Full-length sessions and the full library, ready when the day gets loud. Free for 7 days.',
  },
  focus: {
    headline: 'Settle into deeper work',
    body: 'Full-length focus sessions and the full library. Free for 7 days, then choose a plan.',
  },
  meditation: {
    headline: 'More time for stillness',
    body: 'Longer meditation sessions and the full library. Free for 7 days, then choose a plan.',
  },
  abundance: {
    headline: 'A clearer space to set your intentions',
    body: 'Full-length sessions and the full library for your intention practice. Free for 7 days.',
  },
  connection: {
    headline: 'Room to reflect on the people who matter',
    body: 'Full-length sessions and the full library for reflection. Free for 7 days, then choose a plan.',
  },
  body: {
    headline: 'Gentle sessions for rest and recovery',
    body: 'Full-length sessions and the full library for your wind-down. Free for 7 days.',
  },
  spiritual: {
    headline: 'Space for your spiritual practice',
    body: 'Full-length sessions and the full library for contemplation. Free for 7 days.',
  },
  nature: {
    headline: 'A quiet moment, grounded in nature',
    body: 'Full-length sessions and the full library for grounding breaks. Free for 7 days.',
  },
};

export const DEFAULT_PAYWALL_COPY: PaywallCopy = {
  headline: 'More of what helps you',
  body: 'Full-length sessions and the full library. Free for 7 days, then choose a plan.',
};

export function paywallCopyForIntent(intent?: string | null): PaywallCopy {
  if (intent && intent in PAYWALL_INTENT_COPY) {
    return PAYWALL_INTENT_COPY[intent as IntentCategoryId];
  }
  return DEFAULT_PAYWALL_COPY;
}

export function paywallCopyForTrigger(
  trigger: string | null | undefined,
  limits: { freeMinutes: number; freeSessions: number }
): PaywallCopy | null {
  switch (trigger) {
    case 'preview_complete':
      return {
        headline: 'Hear the whole session',
        body: 'You heard a 3-minute preview. Premium plays the full session and opens every premium track.',
      };
    case 'duration_limit':
      return {
        headline: `Keep listening past ${limits.freeMinutes} minutes`,
        body: `Free sessions stop at ${limits.freeMinutes} minutes. Premium plays the full length.`,
      };
    case 'session_limit':
      return {
        headline: 'That is all your free sessions for today',
        body: `Free listening includes ${limits.freeSessions} sessions a day. Premium removes the daily cap.`,
      };
    default:
      return null;
  }
}
