import { PREMIUM_FREQUENCY_COUNT, CANONICAL_PREMIUM_POLICY } from './usage/PremiumPolicy';

/**
 * Premium benefit copy, in one place.
 *
 * Every entry must correspond to behaviour the app actually ships, and
 * `evidence` records where that behaviour is enforced so a reviewer can check
 * the claim rather than take it on trust.
 *
 * The paywall previously advertised offline downloads, custom frequency mixing
 * and "priority support". None of the three existed: there is no download or
 * mixer code path, and priority support is not a software capability. Those
 * claims were removed. Do not re-add a benefit here without a real gate — the
 * claim is a promise the user pays for.
 */
export interface PremiumBenefit {
  id: string;
  text: string;
  /** Where the app enforces this, so the claim stays checkable. */
  evidence: string;
}

const freeMinutes = Math.round(CANONICAL_PREMIUM_POLICY.freeSessionMaxDuration / 60);
const freeSessions = CANONICAL_PREMIUM_POLICY.dailyFreeSessionsLimit;

export const PREMIUM_BENEFITS: PremiumBenefit[] = [
  {
    id: 'premium-frequencies',
    text: `All ${PREMIUM_FREQUENCY_COUNT} premium tracks in the full library`,
    evidence: 'seed/frequencies isPremium flag, gated in categories.tsx and AudioPlayer.tsx',
  },
  {
    id: 'unlimited-duration',
    text: `Full-length sessions (free: ${freeMinutes} min, ${freeSessions}/day)`,
    evidence: 'usePremiumUsage.getMaxSessionDuration returns Infinity for premium',
  },
  {
    id: 'binaural-beats',
    text: 'Binaural beats and all seven chakra tones',
    evidence: 'premiumFrequencies/binaural/chakra capabilities, gated in AudioPlayer.tsx',
  },
  {
    id: 'guided-programs',
    text: 'Guided programs for sleep, calm and focus',
    evidence: 'seed/programs.ts isPremium, gated in sessions.tsx handleStartStarterSession',
  },
  {
    id: 'custom-affirmations',
    text: 'Record and play your own affirmations',
    evidence: 'AffirmationStreamCard.handleOpenRecordModal returns early when !isPremium',
  },
  {
    id: 'progress-analytics',
    text: 'Progress insights: streaks and listening trends',
    evidence: 'UsageAnalyticsModal.hasAccess requires premium or trial',
  },
];

export const PREMIUM_BENEFIT_TEXTS: string[] = PREMIUM_BENEFITS.map((b) => b.text);
