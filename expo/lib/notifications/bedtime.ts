
export function buildBedtimeReminder(): { hour: number; minute: number; title: string; body: string } {
  return {
    hour: 21,
    minute: 30,
    title: 'A quiet wind-down is waiting',
    body: 'Set aside a few minutes for tonight’s wind-down.',
  };
}

/** Best effort: no permission, no notification. */
export async function scheduleBedtimeReminder(): Promise<void> {
  try {
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const { ensureNotificationChannel, REMINDER_CHANNEL_ID } = require('./permissions') as typeof import('./permissions');
    const permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted) return;
    await ensureNotificationChannel();
    const reminder = buildBedtimeReminder();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { type: 'session-reminder' },
      },
      trigger: {
        hour: reminder.hour,
        minute: reminder.minute,
        repeats: true,
        channelId: REMINDER_CHANNEL_ID,
      } as any,
    });
  } catch {
    // A reminder is optional; onboarding must not fail because of it.
  }
}
