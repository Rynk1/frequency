export type AnalyticsPeriod = 'day' | 'week' | 'month';

export interface UsageEvent {
  id: string;
  date: string;
  durationMinutes: number;
  frequency: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  sessions: number;
  minutes: number;
  activeDays: number;
  topFrequency: string | null;
  dailyMinutes: number[];
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getAnalyticsDates = (period: AnalyticsPeriod, referenceDate = new Date()) => {
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(referenceDate);

  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return { startKey: toDateKey(start), endKey: toDateKey(end) };
};

export const summarizeUsage = (
  events: UsageEvent[],
  period: AnalyticsPeriod,
  referenceDate = new Date()
): AnalyticsSummary => {
  const { startKey, endKey } = getAnalyticsDates(period, referenceDate);
  const filtered = events.filter((event) => event.date >= startKey && event.date <= endKey);
  const frequencyCounts = new Map<string, number>();
  const activeDates = new Set<string>();

  filtered.forEach((event) => {
    activeDates.add(event.date);
    frequencyCounts.set(event.frequency, (frequencyCounts.get(event.frequency) || 0) + event.durationMinutes);
  });

  const topFrequency = [...frequencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const chartLength = period === 'day' ? 1 : period === 'week' ? 7 : new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
  const dailyMinutes = Array.from({ length: chartLength }, (_, index) => {
    const date = new Date(referenceDate);
    if (period === 'day') date.setHours(0, 0, 0, 0);
    else if (period === 'week') {
      const mondayOffset = (referenceDate.getDay() + 6) % 7;
      date.setDate(referenceDate.getDate() - mondayOffset + index);
    } else {
      date.setDate(index + 1);
    }
    const key = toDateKey(date);
    return filtered.filter((event) => event.date === key).reduce((total, event) => total + event.durationMinutes, 0);
  });

  return {
    sessions: filtered.length,
    minutes: filtered.reduce((total, event) => total + event.durationMinutes, 0),
    activeDays: activeDates.size,
    topFrequency,
    dailyMinutes,
  };
};