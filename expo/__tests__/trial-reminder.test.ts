import { describe, it, expect } from 'vitest';
import { buildTrialReminder } from '../lib/notifications/trial-reminder';

describe('trial reminder', () => {
  const start = new Date(2026, 0, 10, 15, 0, 0);

  it('fires on day 5 of a 7-day trial at 10am', () => {
    const reminder = buildTrialReminder(start.getTime());
    expect(reminder.fireAt.getFullYear()).toBe(2026);
    expect(reminder.fireAt.getMonth()).toBe(0);
    expect(reminder.fireAt.getDate()).toBe(15);
    expect(reminder.fireAt.getHours()).toBe(10);
  });

  it('leads with the time left, not a charge', () => {
    const reminder = buildTrialReminder(start.getTime());
    expect(reminder.title).toBe('Your free trial ends in 2 days');
    expect(reminder.body).toContain('Cancel before it ends');
    expect(reminder.body).toContain('renews automatically');
    expect(reminder.body).not.toMatch(/charged|charge you/i);
  });

  it('scales with a shorter trial instead of firing after it ends', () => {
    const reminder = buildTrialReminder(start.getTime(), 3);
    expect(reminder.fireAt.getTime()).toBeLessThan(start.getTime() + 3 * 24 * 60 * 60 * 1000);
  });
});
