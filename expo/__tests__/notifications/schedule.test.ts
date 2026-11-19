import { describe, it, expect } from 'vitest';
import { resolveReminderWeekdays } from '../../lib/notifications/schedule';

describe('resolveReminderWeekdays', () => {
  it('schedules every day when no selection is stored', () => {
    expect(resolveReminderWeekdays(undefined)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(resolveReminderWeekdays([])).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('expands the Daily / Weekdays / Weekends presets', () => {
    expect(resolveReminderWeekdays(['Daily'])).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(resolveReminderWeekdays(['Weekdays'])).toEqual([2, 3, 4, 5, 6]);
    expect(resolveReminderWeekdays(['Weekends'])).toEqual([1, 7]);
  });

  it('maps individual day names to expo weekday numbers', () => {
    expect(resolveReminderWeekdays(['Sunday'])).toEqual([1]);
    expect(resolveReminderWeekdays(['Monday', 'Friday'])).toEqual([2, 6]);
    expect(resolveReminderWeekdays(['Saturday'])).toEqual([7]);
  });

  it('de-duplicates and sorts overlapping selections', () => {
    expect(resolveReminderWeekdays(['Friday', 'Weekdays'])).toEqual([2, 3, 4, 5, 6]);
    expect(resolveReminderWeekdays(['Weekends', 'Saturday'])).toEqual([1, 7]);
  });

  it('falls back to daily rather than silently dropping an unknown selection', () => {
    expect(resolveReminderWeekdays(['Someday'])).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
