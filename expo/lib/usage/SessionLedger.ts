import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Records how many sessions a free listener has started today.
 *
 * Counting *starts* rather than completions matters: a limit checked only
 * against completed sessions can be bypassed indefinitely by abandoning each
 * session before it finishes.
 */
export interface SessionLedger {
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string;
  /** Sessions started on that date. */
  starts: number;
}

const LEDGER_KEY = 'hf:premium:session-ledger';

export function localDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeLedger(ledger: SessionLedger | null, now: Date = new Date()): SessionLedger {
  const today = localDateKey(now);
  if (!ledger || ledger.date !== today) {
    return { date: today, starts: 0 };
  }
  return { date: today, starts: Math.max(0, ledger.starts) };
}

export async function readSessionLedger(now: Date = new Date()): Promise<SessionLedger> {
  try {
    const stored = await AsyncStorage.getItem(LEDGER_KEY);
    return normalizeLedger(stored ? (JSON.parse(stored) as SessionLedger) : null, now);
  } catch {
    return normalizeLedger(null, now);
  }
}

export async function writeSessionLedger(ledger: SessionLedger): Promise<void> {
  try {
    await AsyncStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    // A failed write only risks a slightly more permissive limit, never a
    // blocked paying user, so it is not surfaced to the listener.
  }
}

export function remainingStarts(ledger: SessionLedger, limit: number): number {
  return Math.max(0, limit - ledger.starts);
}
