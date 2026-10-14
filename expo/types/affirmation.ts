export type AffirmationMode = 'off' | 'visual' | 'spoken' | 'both';

export type AffirmationStatus = 'draft' | 'published' | 'archived';

export type AffirmationCategory =
  | 'confidence'
  | 'relationships'
  | 'financial_mindset'
  | 'self_care'
  | 'focus'
  | 'creativity'
  | 'relaxation'
  | 'sleep_wind_down'
  | 'gratitude'
  | 'resilience';

export type AffirmationTone = 'gentle' | 'grounded' | 'encouraging' | 'reflective';

export interface Affirmation {
  id: string;
  text: string;
  title?: string;
  category: AffirmationCategory;
  intentTags: string[];
  compatibleFrequencyIds?: string[];
  sessionContexts: string[];
  status: AffirmationStatus;
  language: string;
  tone?: AffirmationTone;
  spokenAssetId?: string;
  durationSeconds?: number;
  displayOrder?: number;
  evidenceNotes?: string;
  safetyNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AffirmationFilterQuery {
  intentionCategory?: AffirmationCategory | string;
  frequencyId?: string;
  sessionContext?: string;
  language?: string;
  tone?: AffirmationTone;
  status?: AffirmationStatus;
}

export interface AffirmationSelectionState {
  mode: AffirmationMode;
  selectedIntention: AffirmationCategory;
  activeAffirmationId: string | null;
  autoRotate: boolean;
  rotationIntervalSeconds: number;
  speechVolume: number;
  speechPitch: number;
  speechRate: number;
}

export const CATEGORY_LABELS: Record<AffirmationCategory, { label: string; description: string }> = {
  confidence: {
    label: 'Confidence & Agency',
    description: 'Acknowledge inner strength, steady action, and self-belief',
  },
  relationships: {
    label: 'Relationships & Harmony',
    description: 'Cultivate empathy, clear expression, and respectful boundaries',
  },
  financial_mindset: {
    label: 'Financial Mindset & Action',
    description: 'Focus on grounded decision-making, value creation, and stability',
  },
  self_care: {
    label: 'Self-Care & Wellbeing',
    description: 'Prioritise rest, comfort, and compassionate self-regard',
  },
  focus: {
    label: 'Focus & Concentration',
    description: 'Anchor clear attention and steady progress on active tasks',
  },
  creativity: {
    label: 'Creativity & Flow',
    description: 'Invite unhurried expression and open problem-solving',
  },
  relaxation: {
    label: 'Relaxation & Ease',
    description: 'Ease physical tension and calm busy daytime thoughts',
  },
  sleep_wind_down: {
    label: 'Sleep Wind-Down',
    description: 'Transition softly into evening stillness and restful surrender',
  },
  gratitude: {
    label: 'Gratitude & Perspective',
    description: 'Acknowledge everyday progress and supportive surroundings',
  },
  resilience: {
    label: 'Resilience & Renewal',
    description: 'Navigate change with calm composure and steady endurance',
  },
};
