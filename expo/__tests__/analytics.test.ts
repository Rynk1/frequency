import { describe, expect, it } from 'vitest';
import { summarizeUsage, UsageEvent } from '../lib/analytics';

const events: UsageEvent[] = [
  { id: '1', date: '2026-09-01', durationMinutes: 20, frequency: '528 Hz', createdAt: '2026-09-01T08:00:00.000Z' },
  { id: '2', date: '2026-09-02', durationMinutes: 15, frequency: '432 Hz', createdAt: '2026-09-02T08:00:00.000Z' },
  { id: '3', date: '2026-09-03', durationMinutes: 30, frequency: '528 Hz', createdAt: '2026-09-03T08:00:00.000Z' },
];

describe('Usage analytics summaries', () => {
  it('summarizes the selected week and identifies the strongest frequency', () => {
    const summary = summarizeUsage(events, 'week', new Date(2026, 8, 3));

    expect(summary.sessions).toBe(3);
    expect(summary.minutes).toBe(65);
    expect(summary.activeDays).toBe(3);
    expect(summary.topFrequency).toBe('528 Hz');
    expect(summary.dailyMinutes).toHaveLength(7);
  });

  it('limits a day view to the reference date', () => {
    const summary = summarizeUsage(events, 'day', new Date(2026, 8, 2));

    expect(summary.sessions).toBe(1);
    expect(summary.minutes).toBe(15);
    expect(summary.dailyMinutes).toEqual([15]);
  });
});