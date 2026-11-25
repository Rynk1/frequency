import { describe, it, expect } from 'vitest';
import { buildBedtimeReminder } from '../lib/notifications/bedtime';

describe('bedtime reminder copy', () => {
  it('defaults to 9.30pm', () => {
    const reminder = buildBedtimeReminder();
    expect(reminder.hour).toBe(21);
    expect(reminder.minute).toBe(30);
  });

  it('stays gentle and claim-free', () => {
    const reminder = buildBedtimeReminder();
    const text = `${reminder.title} ${reminder.body}`;
    expect(text).not.toMatch(/cure|treat|guarantee|proven|insomnia|sleep better/i);
    expect(text).not.toContain('!');
  });
});
