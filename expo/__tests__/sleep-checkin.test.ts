import { describe, it, expect } from 'vitest';
import { buildSleepCheckIn } from '../lib/notifications/sleep-checkin';

describe('sleep check-in copy', () => {
  it('schedules for 9am the next morning', () => {
    const reminder = buildSleepCheckIn(new Date(2026, 10, 24, 22, 30, 0));
    expect(reminder.fireAt.getDate()).toBe(25);
    expect(reminder.fireAt.getHours()).toBe(9);
    expect(reminder.fireAt.getMinutes()).toBe(0);
  });

  it('asks a question without promising an outcome', () => {
    const reminder = buildSleepCheckIn();
    const text = `${reminder.title} ${reminder.body}`;
    expect(text).toContain('How was last night?');
    expect(text).not.toMatch(/cure|treat|guarantee|proven|insomnia/i);
    expect(text).not.toContain('!');
  });
});
