import { startTransition, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UsageEvent } from '@/lib/analytics';
import { useDataMode } from './useDataMode';

export const USAGE_EVENTS_STORAGE_KEY = 'usageEvents';

export const useUsageAnalytics = (userId: string | undefined, visible: boolean) => {
  const { shouldUseFirestore } = useDataMode();
  const [events, setEvents] = useState<UsageEvent[]>([]);

  const loadEvents = useCallback(async () => {
    if (!visible) return;
    try {
      let loadedEvents: UsageEvent[] = [];
      if (userId && shouldUseFirestore) {
        const snapshot = await getDocs(collection(db, 'userUsage', userId, 'events'));
        loadedEvents = snapshot.docs.map((item) => item.data() as UsageEvent);
      } else {
        const storedEvents = await AsyncStorage.getItem(USAGE_EVENTS_STORAGE_KEY);
        loadedEvents = storedEvents ? JSON.parse(storedEvents) : [];
      }
      startTransition(() => {
        setEvents(loadedEvents.filter((event) => event.date >= new Date(Date.now() - 31 * 86400000).toISOString().split('T')[0]));
      });
    } catch {
      const storedEvents = await AsyncStorage.getItem(USAGE_EVENTS_STORAGE_KEY);
      startTransition(() => {
        setEvents(storedEvents ? JSON.parse(storedEvents) : []);
      });
    }
  }, [shouldUseFirestore, userId, visible]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return { events, refresh: loadEvents };
};