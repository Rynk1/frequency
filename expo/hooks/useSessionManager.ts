import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import createContextHook from '@nkzw/create-context-hook';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useDataMode } from './useDataMode';
import { getDailyChallenge, getLocalDateString } from '@/lib/recommendation';

interface Frequency {
  hz: number;
  name: string;
  duration: number;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  minDuration?: number;
  maxDuration?: number;
}

const isExpoGo = Constants.appOwnership === 'expo';

const getNotifications = () => {
  if (Platform.OS === 'web' || isExpoGo) return null;
  return require('expo-notifications') as typeof import('expo-notifications');
};

export interface Reminder {
  id: string;
  sessionId: string;
  sessionName: string;
  time: string;
  period: 'AM' | 'PM';
  days: string[];
  notificationId: string | null;
  enabled: boolean;
  userId: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  frequencies: Frequency[];
  totalDuration: number;
  goal: string;
  schedule: string[];
  progress: number;
  lastPlayed?: string;
  totalSessions: number;
  streak: number;
  notes?: string;
  createdAt: string;
  category: 'healing' | 'meditation' | 'sleep' | 'focus' | 'manifestation';
  intensity: 'gentle' | 'moderate' | 'intense';
  completedDates: string[];
  isActive: boolean;
  isPaused: boolean;
  currentFrequencyIndex: number;
  elapsedTime: number;
  allocationMethod: 'equal' | 'priority' | 'custom' | 'smart';
  fadeTransitions: boolean;
  transitionDuration: number;
  type: 'custom' | 'curated' | 'completed_playback';
  notificationEnabled: boolean;
  notificationTime: string | null;
  notificationId: string | null;
  reminderId: string | null;
  userId: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  reward?: string;
  unlockedDate?: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  frequency: number;
  duration: number;
  completed: boolean;
  reward: string;
  date: string;
}

interface SessionStats {
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  sessionsThisWeek: number;
  favoriteFrequency: number;
  totalSessions: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

const STORAGE_KEYS = {
  SESSIONS: 'sessions',
  ACHIEVEMENTS: 'achievements',
  STATS: 'sessionStats',
  DAILY_CHALLENGES: 'dailyChallenges',
  COMPLETED_SESSIONS: 'completedSessions',
  REMINDERS: 'reminders',
};

const initialAchievements: Achievement[] = [
  { id: '1', title: 'First Steps', description: 'Complete your first session', icon: 'trophy', unlocked: false, progress: 0, target: 1, reward: 'Unlock custom timer' },
  { id: '2', title: 'Week Warrior', description: 'Build a 7-day streak', icon: 'fire', unlocked: false, progress: 0, target: 7, reward: 'Unlock advanced frequencies' },
  { id: '3', title: 'Frequency Explorer', description: 'Try 5 different frequencies', icon: 'star', unlocked: false, progress: 0, target: 5, reward: 'Unlock frequency mixer' },
  { id: '4', title: 'Dedication', description: 'Complete 30 sessions', icon: 'medal', unlocked: false, progress: 0, target: 30, reward: 'Unlock master badge' },
  { id: '5', title: 'Night Owl', description: 'Complete 10 sleep sessions', icon: 'moon', unlocked: false, progress: 0, target: 10, reward: 'Unlock dream journal' },
  { id: '6', title: 'Deep Healer', description: 'Complete 10 healing sessions', icon: 'users', unlocked: false, progress: 0, target: 10, reward: 'Unlock group sessions' },
  { id: '7', title: 'Zen Master', description: 'Meditate for 500 minutes total', icon: 'brain', unlocked: false, progress: 0, target: 500, reward: 'Unlock master frequencies' },
  { id: '8', title: 'Century Club', description: 'Complete 100 total sessions', icon: 'sun', unlocked: false, progress: 0, target: 100, reward: 'Unlock sunrise themes' },
];

const generateDailyChallenge = (): DailyChallenge => {
  const challenges = [
    { title: 'Morning Harmony', description: 'Start your day with 528 Hz Love Frequency', frequency: 528, duration: 15, reward: '50 XP + Unlock new visualization' },
    { title: 'Focus Flow', description: 'Enhance concentration with 40 Hz Gamma waves', frequency: 40, duration: 20, reward: '60 XP + Focus badge' },
    { title: 'Deep Relaxation', description: 'Unwind with 432 Hz Universal Harmony', frequency: 432, duration: 10, reward: '40 XP + Relaxation theme' },
    { title: 'Sleep Preparation', description: 'Prepare for rest with 2 Hz Delta waves', frequency: 2, duration: 25, reward: '70 XP + Sleep tracker' },
    { title: 'Energy Boost', description: 'Energize with 741 Hz Awakening Intuition', frequency: 741, duration: 15, reward: '55 XP + Energy badge' },
  ];

  const today = new Date().toISOString().split('T')[0];
  const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

  return {
    id: `challenge-${today}`,
    ...randomChallenge,
    completed: false,
    date: today,
  };
};

/** Get user-scoped Firestore collection paths */
const getUserCollections = (userId: string) => {
  if (!userId) return null;
  return {
    sessions: collection(db, 'userSessions', userId, 'sessions'),
    reminders: collection(db, 'userReminders', userId, 'reminders'),
    statsDoc: doc(db, 'userStats', userId),
    achievementsDoc: doc(db, 'userAchievements', userId),
  };
};

export const [SessionManagerProvider, useSessionManager] = createContextHook(() => {
  const { user } = useAuth();
  const userId = user?.uid || '';
  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [stats, setStats] = useState<SessionStats>({
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    sessionsThisWeek: 0,
    favoriteFrequency: 528,
    totalSessions: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    weeklyGoal: 300,
    weeklyProgress: 0,
  });
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>(() => getDailyChallenge(userId, getLocalDateString()));
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load from Firestore (primary) with AsyncStorage fallback ──
  const loadAllData = useCallback(async () => {
    try {
      const currentUserId = user?.uid || '';

      if (currentUserId && shouldUseFirestore) {
        // Load from Firestore (user-scoped) with 8-second timeout
        try {
          const cols = getUserCollections(currentUserId)!;
          const firestoreTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Session firestore fetch timed out')), 8000)
          );

          const [sessionsSnap, remindersSnap, statsSnap, achievementsSnap] = await Promise.race([
            Promise.all([
              getDocs(cols.sessions),
              getDocs(cols.reminders),
              getDoc(cols.statsDoc),
              getDoc(cols.achievementsDoc),
            ]),
            firestoreTimeout,
          ]);

          if (!sessionsSnap.empty) {
            const firestoreSessions = sessionsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Session));
            setSessions(firestoreSessions);
            await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(firestoreSessions));
          } else {
            // Fall back to AsyncStorage
            const localSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
            if (localSessions) setSessions(JSON.parse(localSessions));
          }

          if (!remindersSnap.empty) {
            const firestoreReminders = remindersSnap.docs.map(d => ({ ...d.data(), id: d.id } as Reminder));
            setReminders(firestoreReminders);
            await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(firestoreReminders));
          } else {
            const localReminders = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
            if (localReminders) setReminders(JSON.parse(localReminders));
          }

          if (statsSnap.exists()) {
            const firestoreStats = statsSnap.data() as SessionStats;
            setStats(firestoreStats);
            await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(firestoreStats));
          } else {
            const localStats = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
            if (localStats) setStats(JSON.parse(localStats));
          }

          if (achievementsSnap.exists()) {
            const firestoreAchievements = (achievementsSnap.data() as any).items as Achievement[];
            if (firestoreAchievements?.length) {
              setAchievements(firestoreAchievements);
              await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(firestoreAchievements));
            }
          } else {
            const localAchievements = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
            if (localAchievements) setAchievements(JSON.parse(localAchievements));
          }
        } catch (firestoreError: any) {
          if (isCloudStrict) {
            const msg = firestoreError?.code === 'permission-denied'
              ? 'Firestore permissions denied for user data — deploy firestore.rules'
              : `Firestore user data load failed: ${firestoreError?.message || firestoreError}`;
            setCloudError(msg);
            console.error('❌ Cloud mode: ' + msg);
            setIsLoading(false);
            throw firestoreError;
          }
          if (firestoreError?.code === 'permission-denied') {
            console.warn('Firestore rules not deployed — using local session data');
          } else {
            console.error('Firestore load failed, using local cache:', firestoreError);
          }
          await loadLocalOnly();
        }
      } else {
        // No user OR local mode — load from AsyncStorage only
        await loadLocalOnly();
      }

      // Daily challenge (stable for the day, time-aware)
      const dateKey = getLocalDateString();
      AsyncStorage.getItem(STORAGE_KEYS.DAILY_CHALLENGES).then((challengeData) => {
        if (challengeData) {
          const challenge = JSON.parse(challengeData);
          if (challenge.date !== dateKey) {
            const newChallenge = getDailyChallenge(currentUserId, dateKey);
            setDailyChallenge(newChallenge);
            AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHALLENGES, JSON.stringify(newChallenge)).catch(() => {});
          } else {
            setDailyChallenge(challenge);
          }
        } else {
          const newChallenge = getDailyChallenge(currentUserId, dateKey);
          setDailyChallenge(newChallenge);
          AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHALLENGES, JSON.stringify(newChallenge)).catch(() => {});
        }
      }).catch(() => {});
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, shouldUseFirestore, isCloudStrict, setCloudError]);

  const loadLocalOnly = async () => {
    const [sessionsData, achievementsData, statsData, remindersData] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
      AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS),
      AsyncStorage.getItem(STORAGE_KEYS.STATS),
      AsyncStorage.getItem(STORAGE_KEYS.REMINDERS),
    ]);
    if (sessionsData) setSessions(JSON.parse(sessionsData));
    if (achievementsData) setAchievements(JSON.parse(achievementsData));
    if (statsData) setStats(JSON.parse(statsData));
    if (remindersData) setReminders(JSON.parse(remindersData));
  };

  // Load session data when user or data mode changes.
  // Using a ref guard to prevent double-firing on React Strict Mode mount/unmount.
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!initialLoadDone.current || user?.uid) {
      initialLoadDone.current = true;
      loadAllData();
    }
  // We only want to reload when the user explicitly changes (sign-in/sign-out) or mode changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, shouldUseFirestore]);

  const saveData = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  // ── Firestore persistence helpers ──
  const syncSessionsToFirestore = async (updatedSessions: Session[]) => {
    if (!userId || !shouldUseFirestore) return;
    try {
      const cols = getUserCollections(userId);
      if (!cols) return;
      const batch = writeBatch(db);
      const existing = await getDocs(cols.sessions);
      existing.docs.forEach(d => batch.delete(d.ref));
      updatedSessions.forEach(s => {
        const { id, ...data } = s;
        batch.set(doc(cols.sessions, id), data);
      });
      await batch.commit();
    } catch (error: any) {
      if (isCloudStrict) {
        setCloudError(`Failed to sync sessions: ${error?.message || error}`);
        throw error;
      }
    }
  };

  const syncRemindersToFirestore = async (updatedReminders: Reminder[]) => {
    if (!userId || !shouldUseFirestore) return;
    try {
      const cols = getUserCollections(userId);
      if (!cols) return;
      const batch = writeBatch(db);
      const existing = await getDocs(cols.reminders);
      existing.docs.forEach(d => batch.delete(d.ref));
      updatedReminders.forEach(r => {
        const { id, ...data } = r;
        batch.set(doc(cols.reminders, id), data);
      });
      await batch.commit();
    } catch (error: any) {
      if (isCloudStrict) {
        setCloudError(`Failed to sync reminders: ${error?.message || error}`);
        throw error;
      }
    }
  };

  const syncStatsToFirestore = async (updatedStats: SessionStats) => {
    if (!userId || !shouldUseFirestore) return;
    try {
      const cols = getUserCollections(userId);
      if (!cols) return;
      await setDoc(cols.statsDoc, updatedStats, { merge: true });
    } catch (error: any) {
      if (isCloudStrict) {
        setCloudError(`Failed to sync stats: ${error?.message || error}`);
        throw error;
      }
    }
  };

  const syncAchievementsToFirestore = async (updatedAchievements: Achievement[]) => {
    if (!userId || !shouldUseFirestore) return;
    try {
      const cols = getUserCollections(userId);
      if (!cols) return;
      await setDoc(cols.achievementsDoc, { items: updatedAchievements }, { merge: true });
    } catch (error: any) {
      if (isCloudStrict) {
        setCloudError(`Failed to sync achievements: ${error?.message || error}`);
        throw error;
      }
    }
  };

  // Smart duration allocation algorithm
  const allocateSessionDuration = useCallback((frequencies: Frequency[], totalDuration: number, method: 'equal' | 'priority' | 'custom' | 'smart' = 'smart'): Frequency[] => {
    if (frequencies.length === 0) return [];

    const allocatedFrequencies = [...frequencies];
    const totalMinutes = totalDuration;

    switch (method) {
      case 'equal': {
        const equalDuration = Math.floor(totalMinutes / frequencies.length);
        const remainder = totalMinutes % frequencies.length;
        allocatedFrequencies.forEach((freq, index) => {
          freq.duration = equalDuration + (index < remainder ? 1 : 0);
        });
        break;
      }
      case 'priority': {
        const priorityWeights = { high: 3, medium: 2, low: 1 };
        const totalWeight = frequencies.reduce((sum, freq) => {
          const priority = freq.priority || 'medium';
          return sum + priorityWeights[priority];
        }, 0);
        allocatedFrequencies.forEach(freq => {
          const priority = freq.priority || 'medium';
          const weight = priorityWeights[priority];
          freq.duration = Math.max(1, Math.floor((weight / totalWeight) * totalMinutes));
        });
        break;
      }
      case 'smart': {
        const smartWeights = frequencies.map(freq => {
          let weight = 1;
          if (freq.category === 'healing' || freq.hz === 528 || freq.hz === 432) weight += 0.5;
          if (freq.hz <= 40 && freq.hz >= 1) weight += 0.3;
          if ([174, 285, 396, 417, 528, 639, 741, 852, 963].includes(freq.hz)) weight += 0.4;
          if (freq.minDuration) weight = Math.max(weight, freq.minDuration / totalMinutes);
          if (freq.maxDuration) weight = Math.min(weight, freq.maxDuration / totalMinutes);
          return weight;
        });
        const totalSmartWeight = smartWeights.reduce((sum, weight) => sum + weight, 0);
        allocatedFrequencies.forEach((freq, index) => {
          const allocatedTime = Math.max(1, Math.floor((smartWeights[index] / totalSmartWeight) * totalMinutes));
          freq.duration = Math.min(allocatedTime, freq.maxDuration || totalMinutes);
          freq.duration = Math.max(freq.duration, freq.minDuration || 1);
        });
        const allocatedTotal = allocatedFrequencies.reduce((sum, freq) => sum + freq.duration, 0);
        if (allocatedTotal !== totalMinutes) {
          const diff = totalMinutes - allocatedTotal;
          for (let i = 0; i < Math.abs(diff); i++) {
            const targetIndex = i % allocatedFrequencies.length;
            if (diff > 0) {
              allocatedFrequencies[targetIndex].duration += 1;
            } else if (allocatedFrequencies[targetIndex].duration > 1) {
              allocatedFrequencies[targetIndex].duration -= 1;
            }
          }
        }
        break;
      }
      case 'custom': {
        const currentTotal = frequencies.reduce((sum, freq) => sum + (freq.duration || 0), 0);
        if (currentTotal !== totalMinutes && currentTotal > 0) {
          const scaleFactor = totalMinutes / currentTotal;
          allocatedFrequencies.forEach(freq => {
            freq.duration = Math.max(1, Math.round((freq.duration || 1) * scaleFactor));
          });
        }
        break;
      }
    }

    return allocatedFrequencies;
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    const Notifications = getNotifications();
    if (!Notifications) return false;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') return true;
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === 'granted';
    } catch (e) {
      console.warn('Notifications permission check skipped in current environment:', e);
      return false;
    }
  }, []);

  const scheduleReminderNotification = useCallback(async (
    sessionName: string,
    hour: number,
    minute: number,
    _days: string[]
  ): Promise<string | null> => {
    const Notifications = getNotifications();
    if (!Notifications) return null;
    try {
      const granted = await requestNotificationPermission();
      if (!granted) return null;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎵 Session Reminder',
          body: `Time for your "${sessionName}" healing session`,
          data: { sessionName, type: 'session-reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      return id;
    } catch (e) {
      console.warn('Notification scheduling skipped in Expo Go:', e);
      return null;
    }
  }, [requestNotificationPermission]);

  const cancelReminderNotification = useCallback(async (notificationId: string | null) => {
    const Notifications = getNotifications();
    if (!notificationId || !Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn('Notification cancellation skipped in Expo Go:', e);
    }
  }, []);

  const createReminder = useCallback(async (
    sessionId: string,
    sessionName: string,
    time: string,
    period: 'AM' | 'PM',
    days: string[],
    reminderUserId: string
  ): Promise<Reminder | null> => {
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const minute = parseInt(minuteStr, 10);

    const notifId = await scheduleReminderNotification(sessionName, hour, minute, days);

    const reminder: Reminder = {
      id: `reminder-${Date.now()}`,
      sessionId,
      sessionName,
      time,
      period,
      days,
      notificationId: notifId,
      enabled: true,
      userId: reminderUserId,
      createdAt: new Date().toISOString(),
    };

    const updatedReminders = [...reminders, reminder];
    setReminders(updatedReminders);
    await saveData(STORAGE_KEYS.REMINDERS, updatedReminders);
    await syncRemindersToFirestore(updatedReminders);
    return reminder;
  }, [reminders, scheduleReminderNotification]);

  const updateReminder = useCallback(async (reminderId: string, updates: Partial<Reminder>) => {
    const updatedReminders = reminders.map(r =>
      r.id === reminderId ? { ...r, ...updates } : r
    );
    setReminders(updatedReminders);
    await saveData(STORAGE_KEYS.REMINDERS, updatedReminders);
    await syncRemindersToFirestore(updatedReminders);
  }, [reminders]);

  const deleteReminder = useCallback(async (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder?.notificationId) {
      await cancelReminderNotification(reminder.notificationId);
    }
    const updatedReminders = reminders.filter(r => r.id !== reminderId);
    setReminders(updatedReminders);
    await saveData(STORAGE_KEYS.REMINDERS, updatedReminders);
    await syncRemindersToFirestore(updatedReminders);
  }, [reminders, cancelReminderNotification]);

  const getRemindersForSession = useCallback((sessionId: string): Reminder[] => {
    return reminders.filter(r => r.sessionId === sessionId && r.enabled);
  }, [reminders]);

  const createSession = useCallback(async (sessionData: Omit<Session, 'id' | 'createdAt' | 'completedDates' | 'isActive' | 'isPaused' | 'currentFrequencyIndex' | 'elapsedTime' | 'allocationMethod' | 'fadeTransitions' | 'transitionDuration'>) => {
    const allocatedFrequencies = allocateSessionDuration(
      sessionData.frequencies,
      sessionData.totalDuration,
      'smart'
    );

    const newSession: Session = {
      ...sessionData,
      frequencies: allocatedFrequencies,
      id: `session-${Date.now()}`,
      createdAt: new Date().toISOString(),
      completedDates: [],
      isActive: false,
      isPaused: false,
      currentFrequencyIndex: 0,
      elapsedTime: 0,
      allocationMethod: 'smart',
      fadeTransitions: true,
      transitionDuration: 3,
      type: sessionData.type || 'custom',
      notificationEnabled: sessionData.notificationEnabled || false,
      notificationTime: sessionData.notificationTime || null,
      notificationId: sessionData.notificationId || null,
      reminderId: sessionData.reminderId || null,
      userId: sessionData.userId || userId || '',
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    await saveData(STORAGE_KEYS.SESSIONS, updatedSessions);
    await syncSessionsToFirestore(updatedSessions);

    return newSession;
  }, [sessions, allocateSessionDuration, userId]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId ? { ...session, ...updates } : session
    );
    setSessions(updatedSessions);
    await saveData(STORAGE_KEYS.SESSIONS, updatedSessions);
    await syncSessionsToFirestore(updatedSessions);
  }, [sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const sessionReminders = reminders.filter(r => r.sessionId === sessionId);
    for (const r of sessionReminders) {
      await cancelReminderNotification(r.notificationId);
    }
    const updatedReminders = reminders.filter(r => r.sessionId !== sessionId);
    setReminders(updatedReminders);
    await saveData(STORAGE_KEYS.REMINDERS, updatedReminders);
    await syncRemindersToFirestore(updatedReminders);

    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    await saveData(STORAGE_KEYS.SESSIONS, updatedSessions);
    await syncSessionsToFirestore(updatedSessions);
  }, [sessions, reminders, cancelReminderNotification]);

  const startSession = useCallback(async (sessionId: string) => {
    await updateSession(sessionId, {
      isActive: true,
      isPaused: false,
      lastPlayed: new Date().toISOString(),
    });
  }, [updateSession]);

  const pauseSession = useCallback(async (sessionId: string) => {
    await updateSession(sessionId, { isPaused: true });
  }, [updateSession]);

  const resumeSession = useCallback(async (sessionId: string) => {
    await updateSession(sessionId, { isPaused: false });
  }, [updateSession]);

  const recomputeAchievements = useCallback(async (
    allSessions: Session[],
    currentStats: SessionStats
  ) => {
    const now = new Date().toISOString();
    const updatedAchievements = [...achievements];
    // Preserve previously unlocked state
    for (const a of updatedAchievements) {
      if (achievements.find(pa => pa.id === a.id && pa.unlocked)) {
        a.unlocked = true;
        a.unlockedDate = achievements.find(pa => pa.id === a.id)?.unlockedDate;
      }
    }

    const allCompleted = allSessions.filter(s => s.totalSessions > 0 || s.progress >= 100);
    const totalCompleted = allCompleted.length;
    const totalMinutes = currentStats.totalMinutes;
    const currentStreak = currentStats.currentStreak;

    const uniqueHzs = new Set<number>();
    allCompleted.forEach(s => s.frequencies.forEach(f => uniqueHzs.add(f.hz)));
    const uniqueFreqCount = uniqueHzs.size;

    const sleepCount = allCompleted.filter(s => s.category === 'sleep').length;
    const healingMedCount = allCompleted.filter(s => s.category === 'healing' || s.category === 'meditation').length;

    updatedAchievements.forEach(ach => {
      switch (ach.id) {
        case '1':
          ach.progress = Math.min(totalCompleted, ach.target);
          if (totalCompleted >= ach.target) { ach.unlocked = true; ach.unlockedDate = ach.unlockedDate || now; }
          break;
        case '2':
          ach.progress = Math.min(currentStreak, ach.target);
          if (currentStreak >= ach.target) { ach.unlocked = true; ach.unlockedDate = ach.unlockedDate || now; }
          break;
        case '3':
          ach.progress = Math.min(uniqueFreqCount, ach.target);
          if (uniqueFreqCount >= ach.target) { ach.unlocked = true; ach.unlockedDate = ach.unlockedDate || now; }
          break;
        case '4':
          ach.progress = Math.min(totalCompleted, ach.target);
          if (totalCompleted >= ach.target) { ach.unlocked = true; ach.unlockedDate = ach.unlockedDate || now; }
          break;
        case '5':
          ach.progress = Math.min(sleepCount, ach.target);
          if (sleepCount >= ach.target) { ach.unlocked = true; ach.unlockedDate = ach.unlockedDate || now; }
          break;
        case '6':
          ach.progress = Math.min(healingMedCount, ach.target);
          if (healingMedCount >= ach.target) { ach.unlocked = true; ach.unlockedDate = ach.unlockedDate || now; }
          break;
        case '7':
          ach.progress = Math.min(totalMinutes, ach.target);
          if (totalMinutes >= ach.target) { ach.unlocked = true; ach.unlockedDate = ach.unlockedDate || now; }
          break;
        case '8':
          ach.progress = Math.min(totalCompleted, ach.target);
          if (totalCompleted >= ach.target) { ach.unlocked = true; ach.unlockedDate = ach.unlockedDate || now; }
          break;
      }
    });

    setAchievements(updatedAchievements);
    await saveData(STORAGE_KEYS.ACHIEVEMENTS, updatedAchievements);
    await syncAchievementsToFirestore(updatedAchievements);
  }, [achievements]);

  const { trackUsage } = useAuth();

  const completeSession = useCallback(async (sessionId: string, duration: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const today = getLocalDateString();
    const updatedSession = {
      ...session,
      totalSessions: session.totalSessions + 1,
      completedDates: [...session.completedDates, today],
      progress: Math.min(100, session.progress + (100 / Math.max(1, session.goal.length))),
      isActive: false,
      isPaused: false,
      currentFrequencyIndex: 0,
      elapsedTime: 0,
    };

    const updatedSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
    setSessions(updatedSessions);
    await saveData(STORAGE_KEYS.SESSIONS, updatedSessions);
    await syncSessionsToFirestore(updatedSessions);

    const minsToAdd = Math.max(1, Math.floor(duration / 60));
    const firstFreq = session.frequencies[0]?.name || session.category || 'Custom Session';

    // Route stats completion through unified useAuth pathway
    if (trackUsage) {
      await trackUsage(minsToAdd, firstFreq);
    }

    const updatedStats = {
      ...stats,
      totalMinutes: stats.totalMinutes + minsToAdd,
      totalSessions: stats.totalSessions + 1,
      xp: stats.xp + minsToAdd * 10,
      weeklyProgress: stats.weeklyProgress + minsToAdd,
    };

    if (updatedStats.xp >= updatedStats.nextLevelXp) {
      updatedStats.level += 1;
      updatedStats.xp = updatedStats.xp - updatedStats.nextLevelXp;
      updatedStats.nextLevelXp = updatedStats.level * 150;
    }

    setStats(updatedStats);
    await saveData(STORAGE_KEYS.STATS, updatedStats);
    await syncStatsToFirestore(updatedStats);

    await recomputeAchievements(updatedSessions, updatedStats);
  }, [sessions, stats, recomputeAchievements, trackUsage]);

  const completeDailyChallenge = useCallback(async () => {
    const updatedChallenge = { ...dailyChallenge, completed: true };
    setDailyChallenge(updatedChallenge);
    await saveData(STORAGE_KEYS.DAILY_CHALLENGES, updatedChallenge);

    const xpReward = parseInt(updatedChallenge.reward.match(/\d+/)?.[0] || '50');
    const updatedStats = {
      ...stats,
      xp: stats.xp + xpReward,
    };

    if (updatedStats.xp >= updatedStats.nextLevelXp) {
      updatedStats.level += 1;
      updatedStats.xp = updatedStats.xp - updatedStats.nextLevelXp;
      updatedStats.nextLevelXp = updatedStats.level * 150;
    }

    setStats(updatedStats);
    await saveData(STORAGE_KEYS.STATS, updatedStats);
    await syncStatsToFirestore(updatedStats);
  }, [dailyChallenge, stats]);

  const updateStreak = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const todayCompleted = sessions.some(s => s.completedDates?.includes(today));
    const yesterdayCompleted = sessions.some(s => s.completedDates?.includes(yesterday));

    let newStreak = stats.currentStreak;
    if (todayCompleted && !yesterdayCompleted) {
      newStreak = 1;
    } else if (todayCompleted && yesterdayCompleted) {
      newStreak = Math.max(1, stats.currentStreak + 1);
    }

    const updatedStats = {
      ...stats,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, stats.longestStreak),
    };

    setStats(updatedStats);
    await saveData(STORAGE_KEYS.STATS, updatedStats);
    await syncStatsToFirestore(updatedStats);
  }, [sessions, stats]);

  const getSessionsThisWeek = useCallback(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    return sessions.filter(s =>
      s.completedDates.some(date => date >= weekAgo)
    ).length;
  }, [sessions]);

  const activeSessions = useMemo(() =>
    sessions.filter(s => s.progress < 100),
    [sessions]
  );

  const scheduledSessions = useMemo(() =>
    sessions.filter(s => s.schedule && s.schedule.length > 0),
    [sessions]
  );

  const completedSessions = useMemo(() =>
    sessions.filter(s => s.progress >= 100 || s.totalSessions > 0),
    [sessions]
  );

  const reallocateSessionDuration = useCallback(async (sessionId: string, newTotalDuration: number, method?: 'equal' | 'priority' | 'custom' | 'smart') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const allocationMethod = method || session.allocationMethod || 'smart';
    const reallocatedFrequencies = allocateSessionDuration(
      session.frequencies,
      newTotalDuration,
      allocationMethod
    );

    await updateSession(sessionId, {
      frequencies: reallocatedFrequencies,
      totalDuration: newTotalDuration,
      allocationMethod,
    });
  }, [sessions, allocateSessionDuration, updateSession]);

  const getSessionProgress = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.isActive) return { progress: 0, currentFrequency: null, timeInCurrentFreq: 0, totalTimeLeft: 0 };

    const totalSessionTime = session.frequencies.reduce((sum, freq) => sum + freq.duration * 60, 0);
    const elapsedTime = session.elapsedTime;
    const progress = Math.min(100, (elapsedTime / totalSessionTime) * 100);

    let accumulatedTime = 0;
    let currentFrequencyIndex = 0;
    let timeInCurrentFreq = 0;

    for (let i = 0; i < session.frequencies.length; i++) {
      const freqDuration = session.frequencies[i].duration * 60;
      if (elapsedTime <= accumulatedTime + freqDuration) {
        currentFrequencyIndex = i;
        timeInCurrentFreq = elapsedTime - accumulatedTime;
        break;
      }
      accumulatedTime += freqDuration;
    }

    return {
      progress,
      currentFrequency: session.frequencies[currentFrequencyIndex],
      currentFrequencyIndex,
      timeInCurrentFreq,
      totalTimeLeft: totalSessionTime - elapsedTime,
      frequencyTimeLeft: (session.frequencies[currentFrequencyIndex]?.duration * 60 || 0) - timeInCurrentFreq,
    };
  }, [sessions]);

  return {
    sessions,
    activeSessions,
    scheduledSessions,
    completedSessions,
    achievements,
    stats,
    dailyChallenge,
    reminders,
    isLoading,
    createSession,
    updateSession,
    deleteSession,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    completeDailyChallenge,
    updateStreak,
    getSessionsThisWeek,
    allocateSessionDuration,
    reallocateSessionDuration,
    getSessionProgress,
    requestNotificationPermission,
    createReminder,
    updateReminder,
    deleteReminder,
    getRemindersForSession,
    cancelReminderNotification,
  };
});
