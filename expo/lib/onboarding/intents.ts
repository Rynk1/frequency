import type { IntentCategoryId } from '@/lib/catalogue/intent-taxonomy';

/** Stored profile value. Kept for backwards compatibility with existing profiles. */
export type StoredGoal = 'focus' | 'sleep' | 'meditation' | 'healing';

export interface OnboardingIntent {
  id: IntentCategoryId;
  goal: StoredGoal;
  title: string;
  description: string;
}

/**
 * The first question asks what the listener needs, not which frequency they
 * want. Six needs cover the largest search intents without turning onboarding
 * into a catalogue.
 */
export const ONBOARDING_INTENTS: OnboardingIntent[] = [
  {
    id: 'sleep',
    goal: 'sleep',
    title: 'Sleep and rest',
    description: 'Wind down and settle for the night.',
  },
  {
    id: 'calm',
    goal: 'healing',
    title: 'Calm and stress relief',
    description: 'A quieter head and a slower breath.',
  },
  {
    id: 'focus',
    goal: 'focus',
    title: 'Focus and study',
    description: 'Settle into deep work, revision or reading.',
  },
  {
    id: 'meditation',
    goal: 'meditation',
    title: 'Meditation',
    description: 'Space for stillness and reflection.',
  },
  {
    id: 'abundance',
    goal: 'focus',
    title: 'Abundance and intention',
    description: 'Set goals and a constructive money mindset.',
  },
  {
    id: 'body',
    goal: 'healing',
    title: 'Body and recovery',
    description: 'Gentle listening for rest and relaxation.',
  },
];

export function onboardingIntentById(id: IntentCategoryId): OnboardingIntent | undefined {
  return ONBOARDING_INTENTS.find((intent) => intent.id === id);
}

export function defaultOnboardingIntent(): OnboardingIntent {
  return ONBOARDING_INTENTS[0];
}
