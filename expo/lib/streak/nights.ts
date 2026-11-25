/** A night runs from 6pm to 4am local time. */
export function isNightTime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 18 || hour < 4;
}

export function weekKey(date: Date = new Date()): string {
  const copy = new Date(date);
  const day = copy.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMonday);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(copy.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

export function nightsThisWeek(nightDates: string[] = [], now: Date = new Date()): number {
  const monday = weekKey(now);
  const nextMonday = new Date(`${monday}T00:00:00`);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const end = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`;
  return new Set(nightDates.filter((date) => date >= monday && date < end)).size;
}
