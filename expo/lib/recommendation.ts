import {
  SOLFEGGIO_FREQUENCIES,
  CHAKRA_FREQUENCIES,
  BINAURAL_BEATS,
  HEALING_FREQUENCIES,
  SLEEP_FREQUENCIES,
  WEALTH_FREQUENCIES,
} from '../constants/frequencies';

export interface DailyAlignment {
  dateStr: string; // YYYY-MM-DD
  frequencies: Array<{
    hz: number;
    name: string;
    duration: number;
    category: string;
  }>;
  label: string;
}

export interface DailyChallengeItem {
  id: string;
  title: string;
  description: string;
  frequency: number;
  duration: number;
  completed: boolean;
  reward: string;
  date: string;
}

/**
 * Deterministic string hash algorithm (cyrb53 / FNV-1a mix)
 * Returns an integer between 0 and 2^32-1
 */
export function hashSeed(str: string): number {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 16777619);
  }
  return h1 >>> 0;
}

/**
 * Pseudo-random generator using a seeded number
 * Returns a float between 0 and 1
 */
export function seededRandom(seed: number, index: number = 0): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

/**
 * Format local Date to YYYY-MM-DD string consistently in user's local timezone
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ALL_FREQUENCY_POOL = [
  ...SOLFEGGIO_FREQUENCIES.map((f) => ({ ...f, category: 'Solfeggio' })),
  ...CHAKRA_FREQUENCIES.map((f) => ({ ...f, category: 'Chakra' })),
  ...BINAURAL_BEATS.map((f) => ({ ...f, category: 'Binaural' })),
  ...HEALING_FREQUENCIES.map((f) => ({ ...f, category: 'Healing' })),
  ...SLEEP_FREQUENCIES.map((f) => ({ ...f, category: 'Sleep' })),
  ...WEALTH_FREQUENCIES.map((f) => ({ ...f, category: 'Wealth' })),
];

/**
 * Generates a stable, once-per-day Daily Alignment selection for a given userId + YYYY-MM-DD
 */
export function getDailyAlignment(userId: string = 'guest', dateStr?: string): DailyAlignment {
  const dateKey = dateStr || getLocalDateString();
  const seedKey = `alignment_${userId}_${dateKey}`;
  const seed = hashSeed(seedKey);

  // Pick 3 distinct frequencies deterministically
  const pool = [...ALL_FREQUENCY_POOL];
  const selectedFreqs: DailyAlignment['frequencies'] = [];

  for (let i = 0; i < 3; i++) {
    const rand = seededRandom(seed, i + 1);
    const index = Math.floor(rand * pool.length);
    const item = pool[index];
    selectedFreqs.push({
      hz: item.hz,
      name: item.name,
      duration: 10,
      category: item.category,
    });
    pool.splice(index, 1);
  }

  const hzList = selectedFreqs.map((f) => `${f.hz}Hz`).join(' · ');

  return {
    dateStr: dateKey,
    frequencies: selectedFreqs,
    label: hzList,
  };
}

/**
 * Time-aware & stable Daily Challenge generator
 * Respects clock time of day and returns a stable daily challenge for userId + YYYY-MM-DD
 */
export function getDailyChallenge(
  userId: string = 'guest',
  dateStr?: string,
  currentHour?: number
): DailyChallengeItem {
  const dateKey = dateStr || getLocalDateString();
  const hour = currentHour !== undefined ? currentHour : new Date().getHours();
  const seedKey = `challenge_${userId}_${dateKey}`;
  const seed = hashSeed(seedKey);

  let challengePool: Array<{
    title: string;
    description: string;
    frequency: number;
    duration: number;
    reward: string;
  }> = [];

  // Morning (5 AM - 11 AM)
  if (hour >= 5 && hour < 11) {
    challengePool = [
      {
        title: 'Morning Harmony',
        description: 'Start your day with 528 Hz Love Frequency',
        frequency: 528,
        duration: 15,
        reward: '50 XP + Unlock morning focus',
      },
      {
        title: 'Awakening Vitality',
        description: 'Energize your mind with 741 Hz Intuition Boost',
        frequency: 741,
        duration: 15,
        reward: '55 XP + Vitality Badge',
      },
      {
        title: 'Dawn Harmony',
        description: 'Align with 432 Hz Natural Earth Tuning',
        frequency: 432,
        duration: 10,
        reward: '40 XP + Dawn Aura',
      },
    ];
  } else if (hour >= 11 && hour < 17) {
    // Afternoon (11 AM - 5 PM)
    challengePool = [
      {
        title: 'Focus Flow',
        description: 'Enhance concentration with 40 Hz Gamma waves',
        frequency: 40,
        duration: 20,
        reward: '60 XP + Focus Badge',
      },
      {
        title: 'Midday Recharge',
        description: 'Reset stress levels with 528 Hz Transformation',
        frequency: 528,
        duration: 15,
        reward: '50 XP + Clarity Boost',
      },
      {
        title: 'Abundance Pulse',
        description: 'Attract focus and wealth with 888 Hz Abundance',
        frequency: 888,
        duration: 15,
        reward: '65 XP + Wealth Sparkle',
      },
    ];
  } else if (hour >= 17 && hour < 21) {
    // Evening (5 PM - 9 PM)
    challengePool = [
      {
        title: 'Deep Relaxation',
        description: 'Unwind evening stress with 432 Hz Universal Resonance',
        frequency: 432,
        duration: 15,
        reward: '45 XP + Evening Calm',
      },
      {
        title: 'Relationship Harmony',
        description: 'Harmonize connection with 639 Hz Solfeggio',
        frequency: 639,
        duration: 15,
        reward: '50 XP + Harmony Badge',
      },
      {
        title: 'Foundation Reset',
        description: 'Ground physical tension with 174 Hz Foundation',
        frequency: 174,
        duration: 15,
        reward: '50 XP + Grounding Touch',
      },
    ];
  } else {
    // Night (9 PM - 5 AM)
    challengePool = [
      {
        title: 'Sleep Preparation',
        description: 'Prepare for deep rest with 2 Hz Delta waves',
        frequency: 2,
        duration: 25,
        reward: '70 XP + Sleep Tracker',
      },
      {
        title: 'Night Meditation',
        description: 'Ease into subconscious healing with 6 Hz Theta waves',
        frequency: 6,
        duration: 20,
        reward: '60 XP + Night Calm',
      },
      {
        title: 'Peaceful Restoration',
        description: 'Restorative night rest with 285 Hz Quantum Repair',
        frequency: 285,
        duration: 20,
        reward: '65 XP + Dream Key',
      },
    ];
  }

  const randIndex = Math.floor(seededRandom(seed, 1) * challengePool.length);
  const selected = challengePool[randIndex];

  return {
    id: `challenge-${dateKey}`,
    ...selected,
    completed: false,
    date: dateKey,
  };
}
