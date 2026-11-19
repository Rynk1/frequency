import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

function getNotifications(): any | null {
  if (Platform.OS === 'web' || isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export const REMINDER_CHANNEL_ID = 'session-reminders';

/** Creates the Android channel required for notifications to be delivered on API 26+. */
export async function ensureNotificationChannel(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Session reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  } catch {
    // Channel creation is best-effort; scheduling will report its own failure.
  }
}

/**
 * Returns whether notification permission is granted, requesting it when it has
 * not been decided yet. Used by both the settings toggle and the reminder
 * scheduler so the switch state always reflects real OS permission.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    if (!existing.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return Boolean(requested.granted);
  } catch {
    return false;
  }
}
