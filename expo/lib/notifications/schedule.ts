/** Notification weekday numbers follow `expo-notifications`: 1=Sunday … 7=Saturday. */
const WEEKDAY_BY_NAME: Record<string, number> = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7,
};

const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const WEEKDAYS = [2, 3, 4, 5, 6];
const WEEKEND = [1, 7];

/**
 * Expands the reminder schedule labels shown in the UI into concrete weekday
 * numbers so `Daily`/`Weekdays`/`Weekends` and individual days all schedule
 * correctly. An unrecognised or empty selection falls back to every day, which
 * matches the previous (always-daily) behaviour rather than silently dropping
 * the reminder.
 */
export function resolveReminderWeekdays(days: string[] | undefined): number[] {
  if (!days || days.length === 0) return ALL_WEEKDAYS;

  const resolved = new Set<number>();
  for (const day of days) {
    if (day === 'Daily') return ALL_WEEKDAYS;
    if (day === 'Weekdays') WEEKDAYS.forEach((d) => resolved.add(d));
    else if (day === 'Weekends') WEEKEND.forEach((d) => resolved.add(d));
    else if (WEEKDAY_BY_NAME[day]) resolved.add(WEEKDAY_BY_NAME[day]);
  }

  return resolved.size > 0 ? Array.from(resolved).sort((a, b) => a - b) : ALL_WEEKDAYS;
}
