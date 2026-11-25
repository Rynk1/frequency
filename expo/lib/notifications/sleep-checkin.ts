import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_KEY = 'hf:sleep-checkin:pending';

export interface SleepCheckIn {
  fireAt: string;
  createdAt: string;
}

export function buildSleepCheckIn(now: Date = new Date()): { fireAt: Date; title: string; body: string } {
  const fireAt = new Date(now);
  fireAt.setDate(fireAt.getDate() + 1);
  fireAt.setHours(9, 0, 0, 0);
  return {
    fireAt,
    title: 'How was last night?',
    body: 'One tap helps you shape tonight’s wind-down.',
  };
}

export async function scheduleSleepCheckIn(now: Date = new Date()): Promise<void> {
  const reminder = buildSleepCheckIn(now);
  const pending: SleepCheckIn = {
    fireAt: reminder.fireAt.toISOString(),
    createdAt: now.toISOString(),
  };
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending)).catch(() => {});
  try {
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { type: 'sleep-checkin' },
      },
      trigger: { date: reminder.fireAt } as any,
    });
  } catch {
    // The in-app card still works when notifications are unavailable.
  }
}

export async function readPendingSleepCheckIn(now: Date = new Date()): Promise<SleepCheckIn | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as SleepCheckIn;
    if (!pending?.fireAt || new Date(pending.fireAt).getTime() > now.getTime()) return null;
    return pending;
  } catch {
    return null;
  }
}

export async function clearSleepCheckIn(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
}
