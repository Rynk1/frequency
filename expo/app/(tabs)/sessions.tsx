import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Plus,
  Calendar,
  Trophy,
  ChevronRight,
  Sparkles,
  Heart,
  Brain,
  Zap,
  Star,
  Moon,
  Sun,
  Shield,
  X,
  Volume2,
  Timer,
  Bell,
  TrendingUp,
  Award,
  BarChart3,
  Target,
  Check,
  Repeat,
  Users,
} from 'lucide-react-native';
import { useSessionManager } from '@/hooks/useSessionManager';
import CreateSessionModal from '@/components/CreateSessionModal';
import { useCuratedPrograms } from '@/hooks/useDataHelpers';
import { AudioPlayer } from '@/components/AudioPlayer';
import { DataModeIndicator } from '@/components/DataModeIndicator';
import { FONTS } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

interface Session {
  id: string;
  name: string;
  frequencies: { hz: number; name: string; duration: number }[];
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
}

const STARTER_SESSIONS: Omit<Session, 'id' | 'createdAt'>[] = [
  {
    name: "Morning Energy Boost",
    frequencies: [
      { hz: 528, name: "Love Frequency", duration: 10 },
      { hz: 40, name: "Gamma Focus", duration: 10 },
      { hz: 432, name: "Natural Harmony", duration: 10 }
    ],
    totalDuration: 30,
    goal: "Start your day with vitality and positive energy",
    schedule: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    progress: 0,
    totalSessions: 0,
    streak: 0,
    category: 'focus' as const,
    intensity: 'moderate' as const,
    notes: "Perfect for morning routine."
  },
  {
    name: "Deep Healing Session",
    frequencies: [
      { hz: 174, name: "Foundation Pure", duration: 15 },
      { hz: 285, name: "Transformation Pure", duration: 15 },
      { hz: 528, name: "Love & Miracles", duration: 15 }
    ],
    totalDuration: 45,
    goal: "Comprehensive healing for body, mind, and spirit",
    schedule: ["Sun", "Wed", "Sat"],
    progress: 0,
    totalSessions: 0,
    streak: 0,
    category: 'healing' as const,
    intensity: 'intense' as const,
    notes: "Powerful healing combination."
  },
  {
    name: "Complete Chakra Alignment",
    frequencies: [
      { hz: 194.18, name: "Root Chakra", duration: 8 },
      { hz: 210.42, name: "Sacral Chakra", duration: 8 },
      { hz: 341.3, name: "Heart Chakra", duration: 8 },
      { hz: 963, name: "Crown Chakra", duration: 8 }
    ],
    totalDuration: 56,
    goal: "Balance all chakras for optimal energy flow",
    schedule: ["Sun", "Thu"],
    progress: 0,
    totalSessions: 0,
    streak: 0,
    category: 'healing' as const,
    intensity: 'intense' as const,
    notes: "Complete chakra alignment."
  },
  {
    name: "Deep Meditation Journey",
    frequencies: [
      { hz: 7.83, name: "Schumann Resonance", duration: 10 },
      { hz: 6, name: "Theta Waves", duration: 20 },
      { hz: 852, name: "Spiritual Order", duration: 10 }
    ],
    totalDuration: 40,
    goal: "Achieve profound meditative states",
    schedule: ["Daily"],
    progress: 0,
    totalSessions: 0,
    streak: 0,
    category: 'meditation' as const,
    intensity: 'moderate' as const,
    notes: "Earth frequency grounding."
  },
  {
    name: "Sleep & Dream Enhancement",
    frequencies: [
      { hz: 8, name: "Sleep Transition", duration: 10 },
      { hz: 4.5, name: "REM Sleep", duration: 20 },
      { hz: 1.5, name: "Deep Sleep", duration: 30 }
    ],
    totalDuration: 60,
    goal: "Optimize sleep quality and dream recall",
    schedule: ["Daily"],
    progress: 0,
    totalSessions: 0,
    streak: 0,
    category: 'sleep' as const,
    intensity: 'gentle' as const,
    notes: "Progressive sleep induction."
  },
  {
    name: "Manifestation & Abundance",
    frequencies: [
      { hz: 888, name: "Abundance Frequency", duration: 15 },
      { hz: 528, name: "Manifestation Power", duration: 15 },
      { hz: 10, name: "Alpha Success", duration: 15 }
    ],
    totalDuration: 45,
    goal: "Attract wealth, abundance and manifest desires",
    schedule: ["Mon", "Wed", "Fri"],
    progress: 0,
    totalSessions: 0,
    streak: 0,
    category: 'manifestation' as const,
    intensity: 'moderate' as const,
    notes: "Abundance and success."
  },
];

const CATEGORY_META: Record<string, { color: string; icon: any; gradient: readonly [string, string] }> = {
  healing:       { color: '#F472B6', icon: Heart,    gradient: ['#F472B6', '#DB2777'] as const },
  meditation:    { color: '#A78BFA', icon: Brain,    gradient: ['#A78BFA', '#7C3AED'] as const },
  sleep:         { color: '#60A5FA', icon: Moon,     gradient: ['#60A5FA', '#3B82F6'] as const },
  focus:         { color: '#34D399', icon: Zap,      gradient: ['#34D399', '#10B981'] as const },
  manifestation: { color: '#FBBF24', icon: Sparkles, gradient: ['#FBBF24', '#F59E0B'] as const },
};

const ACHIEVEMENT_ICON_MAP: Record<string, { icon: any; color: string }> = {
  trophy: { icon: Trophy, color: '#D4AF37' },
  fire:   { icon: Zap,    color: '#FF6B35' },
  star:   { icon: Star,   color: '#FBBF24' },
  medal:  { icon: Award,  color: '#60A5FA' },
  moon:   { icon: Moon,   color: '#818CF8' },
  users:  { icon: Users,  color: '#34D399' },
  brain:  { icon: Brain,  color: '#A78BFA' },
  sun:    { icon: Sun,    color: '#F59E0B' },
};

const GlassCard = SharedGlassCard;

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, gradients, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, gradients), [colors, gradients]);
  const [mainTab, setMainTab] = useState<'journey' | 'programs'>('journey');
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'scheduled'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showStarterDetails, setShowStarterDetails] = useState(false);
  const [selectedStarterSession, setSelectedStarterSession] = useState<typeof STARTER_SESSIONS[0] | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioPlayerFrequency, setAudioPlayerFrequency] = useState<any>(null);
  const [audioPlayerSession, setAudioPlayerSession] = useState<{
    frequencies: { hz: number; name: string; duration: number }[];
    name: string;
  } | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const ring3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.07, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(orbAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();
    const startRing = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 3200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    startRing(ring1Anim, 0);
    startRing(ring2Anim, 1067);
    startRing(ring3Anim, 2134);
  }, []);

  const {
    activeSessions,
    scheduledSessions,
    completedSessions,
    achievements,
    stats,
    dailyChallenge,
    reminders,
    createSession,
    startSession,
    completeDailyChallenge,
    getSessionsThisWeek,
    createReminder,
    deleteReminder,
    getRemindersForSession,
  } = useSessionManager();

  const { curatedPrograms: localPrograms } = useCuratedPrograms();
  const { userProfile, isPremium } = useAuth();

  const displayStarterSessions = React.useMemo(() => {
    if (!localPrograms || localPrograms.length === 0) return STARTER_SESSIONS;
    return localPrograms.map((s) => ({
      name: s.name,
      frequencies: s.frequencies.map((f: string) => {
        const hzMatch = f.match(/-(\d+(\.\d+)?)$/);
        const hz = hzMatch ? parseFloat(hzMatch[1]) : 528;
        return {
          hz,
          name: f.replace(/-(\d+(\.\d+)?)$/, '').replace(/-/g, ' '),
          duration: Math.max(1, Math.floor(s.duration / Math.max(1, s.frequencies.length))),
        };
      }),
      totalDuration: s.duration,
      goal: s.description,
      schedule: ["Flexible"],
      progress: 0,
      totalSessions: 0,
      streak: 0,
      category: (s.category || 'meditation') as any,
      intensity: 'moderate' as const,
      notes: s.description,
    }));
  }, [localPrograms]);

  const handleStartDailyAlignment = () => {
    setAudioPlayerFrequency({ hz: 528, name: 'Daily Alignment', description: 'Your daily alignment session' });
    setAudioPlayerSession({
      frequencies: [
        { hz: 528, name: 'Love Frequency', duration: 10 },
        { hz: 432, name: 'Natural Harmony', duration: 10 },
        { hz: 639, name: 'Relationships', duration: 10 },
      ],
      name: 'Daily Alignment',
    });
    setShowAudioPlayer(true);
  };

  const handleStartStarterSession = (session: typeof STARTER_SESSIONS[0]) => {
    setAudioPlayerFrequency({
      hz: session.frequencies[0]?.hz || 528,
      name: session.name,
      description: session.goal,
    });
    setAudioPlayerSession({
      frequencies: session.frequencies,
      name: session.name,
    });
    setShowAudioPlayer(true);
    setShowStarterDetails(false);
  };

  const handleStartSession = (session: Session) => {
    setAudioPlayerFrequency({
      hz: session.frequencies[0]?.hz || 528,
      name: session.name,
      description: session.goal,
    });
    setAudioPlayerSession({
      frequencies: session.frequencies,
      name: session.name,
    });
    setShowAudioPlayer(true);
    setSelectedSession(null);
  };

  const totalMinutes = userProfile?.usageStats?.totalListeningTime || stats?.totalMinutes || 0;
  const streakDays = userProfile?.usageStats?.streakDays || stats?.currentStreak || 0;
  const sessionsCompleted = userProfile?.usageStats?.sessionsCompleted || stats?.totalSessions || 0;
  const currentLevel = Math.floor(sessionsCompleted / 10) + 1;

  // Compute weekly sessions from the user's sessionHistory (stored in Firestore per-user)
  // Falls back to useSessionManager's getSessionsThisWeek if sessionHistory is unavailable
  const userSessionHistory = userProfile?.usageStats?.sessionHistory || [];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weekSessionsFromHistory = userSessionHistory.filter((date: string) => date >= weekAgo).length;
  const weekSessions = weekSessionsFromHistory > 0 ? weekSessionsFromHistory : (getSessionsThisWeek ? getSessionsThisWeek() : 0);

  // Sync achievements from user profile data — ensures per-user accuracy
  const syncedAchievements = useMemo(() => {
    if (!achievements) return [];
    const now = new Date().toISOString();
    return achievements.map((ach: any) => {
      let progress = ach.progress;
      let unlocked = ach.unlocked;
      switch (ach.id) {
        case '1': // First Steps — 1 session
          progress = Math.min(sessionsCompleted, ach.target);
          unlocked = sessionsCompleted >= ach.target;
          break;
        case '2': // Week Warrior — 7 day streak
          progress = Math.min(streakDays, ach.target);
          unlocked = streakDays >= ach.target;
          break;
        case '3': // Frequency Explorer — 5 different frequencies
          const favCount = userProfile?.usageStats?.favoriteFrequencies?.length || 0;
          progress = Math.min(favCount, ach.target);
          unlocked = favCount >= ach.target;
          break;
        case '4': // Dedication — 30 sessions
          progress = Math.min(sessionsCompleted, ach.target);
          unlocked = sessionsCompleted >= ach.target;
          break;
        case '7': // Zen Master — 500 minutes total
          progress = Math.min(totalMinutes, ach.target);
          unlocked = totalMinutes >= ach.target;
          break;
        case '8': // Century Club — 100 sessions
          progress = Math.min(sessionsCompleted, ach.target);
          unlocked = sessionsCompleted >= ach.target;
          break;
      }
      return { ...ach, progress, unlocked, unlockedDate: unlocked && !ach.unlocked ? now : ach.unlockedDate };
    });
  }, [achievements, sessionsCompleted, streakDays, totalMinutes, userProfile?.usageStats?.favoriteFrequencies]);

  const ring1Scale = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ring1Opacity = ring1Anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] });
  const ring2Scale = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] });
  const ring3Scale = ring3Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ring3Opacity = ring3Anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] });

  const renderJourneyTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Orb Hero */}
      <View style={styles.orbSection}>
        {/* Sonar rings */}
        <View style={styles.orbRingContainer}>
          <Animated.View style={[styles.sonarRing, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
          <Animated.View style={[styles.sonarRing, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
          <Animated.View style={[styles.sonarRing, { transform: [{ scale: ring3Scale }], opacity: ring3Opacity }]} />
        </View>
        <View style={styles.orbOuterRing}>
          <View style={styles.orbMiddleRing}>
            <Animated.View style={[styles.orbInner, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['rgba(108,99,255,0.95)', 'rgba(124,58,237,0.8)', 'rgba(167,139,250,0.6)']}
                style={styles.orbGradient}
              />
              <View style={styles.orbContent}>
                <Text style={styles.orbLabel}>Daily Alignment</Text>
                <Text style={styles.orbFreqs}>528Hz · 432Hz · 639Hz</Text>
              </View>
            </Animated.View>
          </View>
        </View>
        <TouchableOpacity style={styles.startSessionBtn} onPress={handleStartDailyAlignment} activeOpacity={0.85}>
          <LinearGradient colors={['rgba(108,99,255,0.95)', 'rgba(124,58,237,0.85)']} style={styles.startSessionBtnGrad}>
            <Play color="#fff" size={16} fill="#fff" />
            <Text style={styles.startSessionBtnText}>Begin Session</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <GlassCard style={styles.statsBar} depth="light">
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <Volume2 color="#60A5FA" size={13} />
            <Text style={[styles.statValue, { color: '#60A5FA' }]}>{totalMinutes}</Text>
          </View>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <Zap color={colors.accent} size={13} />
            <Text style={[styles.statValue, { color: colors.accent }]}>{streakDays}</Text>
          </View>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <Trophy color={colors.gold} size={13} />
            <Text style={[styles.statValue, { color: colors.gold }]}>{currentLevel}</Text>
          </View>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconRow}>
            <Users color="#34D399" size={13} />
            <Text style={[styles.statValue, { color: '#34D399' }]}>{sessionsCompleted}</Text>
          </View>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </GlassCard>

      {/* Daily Challenge */}
      {dailyChallenge && (
        <GlassCard style={styles.challengeCard} depth="normal">
          <LinearGradient
            colors={['rgba(108,99,255,0.25)', 'rgba(124,58,237,0.1)']}
            style={styles.challengeGrad}
          >
            <View style={styles.challengeHeader}>
              <View style={styles.challengeIconWrap}>
                <Star color={colors.gold} size={18} />
              </View>
              <View style={styles.challengeTextWrap}>
                <Text style={styles.challengeTitle}>{dailyChallenge.title}</Text>
                <Text style={styles.challengeDesc}>{dailyChallenge.description}</Text>
              </View>
              {!dailyChallenge.completed && (
                <TouchableOpacity
                  style={styles.challengeBtn}
                  onPress={() => {
                    if (dailyChallenge) {
                      setAudioPlayerFrequency({
                        hz: dailyChallenge.frequency,
                        name: dailyChallenge.title,
                        description: dailyChallenge.description,
                      });
                      setAudioPlayerSession({
                        frequencies: [{
                          hz: dailyChallenge.frequency,
                          name: dailyChallenge.title,
                          duration: dailyChallenge.duration,
                        }],
                        name: dailyChallenge.title,
                      });
                      setShowAudioPlayer(true);
                    }
                  }}
                >
                  <Play color="#fff" size={14} fill="#fff" />
                </TouchableOpacity>
              )}
              {dailyChallenge.completed && (
                <View style={[styles.challengeBtn, { backgroundColor: 'rgba(52,211,153,0.3)' }]}>
                  <Check color="#34D399" size={14} />
                </View>
              )}
            </View>
          </LinearGradient>
        </GlassCard>
      )}

      {/* Week Progress */}
      <GlassCard style={styles.weekCard} depth="light">
        <View style={styles.weekHeader}>
          <Text style={styles.weekTitle}>This Week</Text>
          <Text style={styles.weekCount}>{weekSessions} sessions</Text>
        </View>
        <View style={styles.weekDays}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={i} style={styles.weekDayItem}>
              <View style={[styles.weekDot, i < weekSessions && styles.weekDotActive]} />
              <Text style={styles.weekDayLabel}>{day}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* My Sessions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Sessions</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
          <Plus color={colors.accent} size={16} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {(['active', 'scheduled', 'completed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabPillText, activeTab === tab && styles.tabPillTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'active' && activeSessions.length === 0 && (
        <GlassCard style={styles.emptyCard} depth="light">
          <Play color={colors.textMuted} size={32} />
          <Text style={styles.emptyTitle}>No Active Sessions</Text>
          <Text style={styles.emptyDesc}>Create a session or choose from Healing Programs below</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreateModal(true)}>
            <Plus color={colors.accent} size={14} />
            <Text style={styles.emptyBtnText}>Create Session</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {activeTab === 'active' && activeSessions.map((session: any) => {
        const meta = CATEGORY_META[session.category] || CATEGORY_META.healing;
        const IconComp = meta.icon;
        const sessionReminders = getRemindersForSession(session.id);
        const hasReminder = sessionReminders.length > 0;
        return (
          <TouchableOpacity key={session.id} onPress={() => setSelectedSession(session)} activeOpacity={0.85}>
            <GlassCard style={styles.sessionCard} depth="normal">
              <View style={[styles.sessionAccent, { backgroundColor: meta.color + '30' }]}>
                <IconComp color={meta.color} size={20} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionName}>{session.name}</Text>
                <Text style={styles.sessionGoal} numberOfLines={1}>{session.goal}</Text>
                <View style={styles.sessionMeta}>
                  <Timer color={colors.textMuted} size={12} />
                  <Text style={styles.sessionMetaText}>{session.totalDuration} min</Text>
                  <View style={[styles.intensityDot, { backgroundColor: meta.color }]} />
                  <Text style={styles.sessionMetaText}>{session.intensity}</Text>
                  {hasReminder && (
                    <>
                      <View style={styles.metaSep} />
                      <Bell color={colors.gold} size={11} />
                      <Text style={[styles.sessionMetaText, { color: colors.gold }]}>
                        {sessionReminders[0].time} {sessionReminders[0].period}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.playBtn, { backgroundColor: meta.color + '20', borderColor: meta.color + '40' }]}
                onPress={() => handleStartSession(session)}
              >
                <Play color={meta.color} size={16} fill={meta.color} />
              </TouchableOpacity>
            </GlassCard>
          </TouchableOpacity>
        );
      })}

      {activeTab === 'scheduled' && (
        scheduledSessions.length === 0 ? (
          <GlassCard style={styles.emptyCard} depth="light">
            <Calendar color={colors.textMuted} size={32} />
            <Text style={styles.emptyTitle}>No Scheduled Sessions</Text>
            <Text style={styles.emptyDesc}>Create sessions with a schedule to see them here</Text>
          </GlassCard>
        ) : (
          scheduledSessions.map((session: any) => {
            const meta = CATEGORY_META[session.category] || CATEGORY_META.healing;
            const IconComp = meta.icon;
            const sessionReminders = getRemindersForSession(session.id);
            const hasReminder = sessionReminders.length > 0;
            return (
              <GlassCard key={session.id} style={styles.sessionCard} depth="normal">
                <View style={[styles.sessionAccent, { backgroundColor: meta.color + '30' }]}>
                  <IconComp color={meta.color} size={20} />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <Text style={styles.sessionGoal} numberOfLines={1}>{session.goal}</Text>
                  <View style={styles.sessionMeta}>
                    <Calendar color={colors.textMuted} size={12} />
                    <Text style={styles.sessionMetaText}>{session.schedule?.join(', ')}</Text>
                    {hasReminder && (
                      <>
                        <View style={styles.metaSep} />
                        <Bell color={colors.gold} size={11} />
                        <Text style={[styles.sessionMetaText, { color: colors.gold }]}>
                          {sessionReminders[0].time} {sessionReminders[0].period}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </GlassCard>
            );
          })
        )
      )}

      {activeTab === 'completed' && (
        completedSessions.length === 0 ? (
          <GlassCard style={styles.emptyCard} depth="light">
            <Trophy color={colors.textMuted} size={32} />
            <Text style={styles.emptyTitle}>No Completed Sessions</Text>
            <Text style={styles.emptyDesc}>Complete your first session to see it here</Text>
          </GlassCard>
        ) : (
          completedSessions.map((session: any) => {
            const meta = CATEGORY_META[session.category] || CATEGORY_META.healing;
            const IconComp = meta.icon;
            return (
              <GlassCard key={session.id} style={styles.sessionCard} depth="normal">
                <View style={[styles.sessionAccent, { backgroundColor: meta.color + '30' }]}>
                  <IconComp color={meta.color} size={20} />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <Text style={styles.sessionGoal} numberOfLines={1}>{session.goal}</Text>
                  <View style={styles.sessionMeta}>
                    <Check color="#34D399" size={12} />
                    <Text style={[styles.sessionMetaText, { color: '#34D399' }]}>Completed</Text>
                  </View>
                </View>
              </GlassCard>
            );
          })
        )
      )}

      {/* Achievements */}
      {syncedAchievements && syncedAchievements.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.achievementsUnlocked}>
              {syncedAchievements.filter((a: any) => a.unlocked).length}/{syncedAchievements.length} unlocked
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsRow}
            contentContainerStyle={styles.achievementsRowContent}
          >
            {syncedAchievements.map((ach: any) => {
              const iconMeta = ACHIEVEMENT_ICON_MAP[ach.icon] || { icon: Trophy, color: '#D4AF37' };
              const IconComp = iconMeta.icon;
              const progressPct = Math.min(100, Math.round((ach.progress / ach.target) * 100));
              return (
                <GlassCard
                  key={ach.id}
                  style={[
                    styles.achievementCard,
                    ach.unlocked && { borderColor: iconMeta.color + '50' },
                  ]}
                  depth="light"
                >
                  {ach.unlocked && (
                    <View style={[styles.achievementUnlockedGlow, { backgroundColor: iconMeta.color + '12' }]} />
                  )}
                  <View style={[
                    styles.achievementIconWrap,
                    {
                      backgroundColor: ach.unlocked ? iconMeta.color + '22' : colors.glass,
                      borderColor: ach.unlocked ? iconMeta.color + '40' : colors.glassBorder,
                    },
                  ]}>
                    <IconComp
                      color={ach.unlocked ? iconMeta.color : colors.textMuted}
                      size={22}
                    />
                    {ach.unlocked && (
                      <View style={styles.achievementCheckmark}>
                        <Check color="#fff" size={8} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.achievementTitle, ach.unlocked && { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {ach.title}
                  </Text>
                  <View style={styles.achievementProgressWrap}>
                    <View style={styles.achievementProgress}>
                      <View
                        style={[
                          styles.achievementBar,
                          {
                            width: `${progressPct}%` as any,
                            backgroundColor: ach.unlocked ? iconMeta.color : colors.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.achievementPct, ach.unlocked && { color: iconMeta.color }]}>
                      {progressPct}%
                    </Text>
                  </View>
                </GlassCard>
              );
            })}
          </ScrollView>
        </>
      )}

    </ScrollView>
  );

  const renderProgramsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.programsSubtitle}>Curated healing programs designed by experts</Text>
      {displayStarterSessions.map((session, index) => {
        const meta = CATEGORY_META[session.category] || CATEGORY_META.healing;
        const IconComp = meta.icon;
        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            onPress={() => {
              setSelectedStarterSession(session);
              setShowStarterDetails(true);
            }}
          >
            <GlassCard style={styles.programCard} depth="normal">
              <LinearGradient
                colors={[meta.color + '28', meta.color + '08', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
              />
              {/* Top accent line */}
              <View style={[styles.programTopBorder, { backgroundColor: meta.color + '70' }]} />

              <View style={styles.programCardHeader}>
                <View style={[styles.programIcon, { backgroundColor: meta.color + '20', borderColor: meta.color + '40' }]}>
                  <IconComp color={meta.color} size={22} />
                </View>
                <View style={styles.programHeaderText}>
                  <Text style={styles.programName}>{session.name}</Text>
                  <Text style={styles.programCountText}>{session.frequencies.length} frequencies</Text>
                </View>
                <View style={[styles.programScheduleBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '40' }]}>
                  <Text style={[styles.programScheduleText, { color: meta.color }]}>{session.schedule[0]}</Text>
                </View>
              </View>

              <Text style={styles.programGoal} numberOfLines={2}>{session.goal}</Text>

              <View style={styles.programFreqPreview}>
                {session.frequencies.slice(0, 3).map((f: any, fi: number) => (
                  <View key={fi} style={styles.programFreqRow}>
                    <View style={[styles.programFreqDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.programFreqText}>{f.name} — <Text style={{ color: meta.color }}>{f.hz}Hz</Text></Text>
                  </View>
                ))}
                {session.frequencies.length > 3 && (
                  <Text style={styles.programMoreText}>+{session.frequencies.length - 3} more</Text>
                )}
              </View>

              <View style={styles.programFooter}>
                <View style={styles.programMetaRow}>
                  <View style={styles.programMetaChip}>
                    <Timer color={colors.textMuted} size={11} />
                    <Text style={styles.programMetaText}>{session.totalDuration} min</Text>
                  </View>
                  <View style={[styles.programMetaChip, { backgroundColor: meta.color + '12', borderColor: meta.color + '30' }]}>
                    <Zap color={meta.color} size={11} />
                    <Text style={[styles.programMetaText, { color: meta.color }]}>{session.intensity}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.programStartBtn, { backgroundColor: meta.color + '22', borderColor: meta.color + '55' }]}
                  onPress={() => handleStartStarterSession(session)}
                >
                  <Play color={meta.color} size={13} fill={meta.color} />
                  <Text style={[styles.programStartBtnText, { color: meta.color }]}>Start</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

      {/* Ambient orb background */}
      <View style={styles.bgOrb1} pointerEvents="none" />
      <View style={styles.bgOrb2} pointerEvents="none" />

      {/* Data mode floating toggle */}
      <DataModeIndicator compact />

      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>Your Healing</Text>
            <Text style={styles.headerTitle}>Journey</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {
              setAudioPlayerFrequency({
                hz: dailyChallenge?.frequency || 528,
                name: dailyChallenge?.title || 'Daily Challenge',
                description: dailyChallenge?.description || 'Your daily challenge session',
              });
              setAudioPlayerSession({
                frequencies: [{
                  hz: dailyChallenge?.frequency || 528,
                  name: dailyChallenge?.title || 'Daily Challenge',
                  duration: dailyChallenge?.duration || 15,
                }],
                name: dailyChallenge?.title || 'Daily Challenge',
              });
              setShowAudioPlayer(true);
            }}
          >
            <Bell color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Main tabs */}
        <View style={styles.mainTabBar}>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'journey' && styles.mainTabActive]}
            onPress={() => setMainTab('journey')}
          >
            <Text style={[styles.mainTabText, mainTab === 'journey' && styles.mainTabTextActive]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTab, mainTab === 'programs' && styles.mainTabActive]}
            onPress={() => setMainTab('programs')}
          >
            <Text style={[styles.mainTabText, mainTab === 'programs' && styles.mainTabTextActive]}>Healing Programs</Text>
          </TouchableOpacity>
        </View>

        {mainTab === 'journey' ? renderJourneyTab() : renderProgramsTab()}
      </View>

      {/* Create Session Modal */}
      <CreateSessionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSession={createSession}
      />

      {/* Starter Session Detail Modal */}
      {selectedStarterSession && (
        <Modal visible={showStarterDetails} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.detailModal}>
            <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={[styles.detailContent, { paddingTop: insets.top + 16 }]}>
              <TouchableOpacity onPress={() => setShowStarterDetails(false)} style={styles.detailClose}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>

              {(() => {
                const meta = CATEGORY_META[selectedStarterSession.category] || CATEGORY_META.healing;
                const IconComp = meta.icon;
                return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.detailHero}>
                      <LinearGradient colors={[meta.color + '40', meta.color + '10']} style={styles.detailHeroGrad}>
                        <View style={[styles.detailHeroIcon, { backgroundColor: meta.color + '30', borderColor: meta.color + '50' }]}>
                          <IconComp color={meta.color} size={32} />
                        </View>
                        <Text style={styles.detailName}>{selectedStarterSession.name}</Text>
                        <Text style={styles.detailGoal}>{selectedStarterSession.goal}</Text>
                        <View style={styles.detailMetaRow}>
                          <View style={styles.detailMetaChip}>
                            <Timer color={colors.textMuted} size={12} />
                            <Text style={styles.detailMetaChipText}>{selectedStarterSession.totalDuration} min</Text>
                          </View>
                          <View style={styles.detailMetaChip}>
                            <Zap color={meta.color} size={12} />
                            <Text style={[styles.detailMetaChipText, { color: meta.color }]}>{selectedStarterSession.intensity}</Text>
                          </View>
                          <View style={styles.detailMetaChip}>
                            <Repeat color={colors.textMuted} size={12} />
                            <Text style={styles.detailMetaChipText}>{selectedStarterSession.schedule.join(', ')}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>

                    <Text style={styles.detailSectionTitle}>Frequency Sequence</Text>
                    {selectedStarterSession.frequencies.map((f, i) => (
                      <GlassCard key={i} style={styles.freqItem} depth="light">
                        <View style={[styles.freqNumber, { backgroundColor: meta.color + '20' }]}>
                          <Text style={[styles.freqNumberText, { color: meta.color }]}>{i + 1}</Text>
                        </View>
                        <View style={styles.freqDetails}>
                          <Text style={styles.freqName}>{f.name}</Text>
                          <Text style={styles.freqHz}>{f.hz} Hz · {f.duration} min</Text>
                        </View>
                      </GlassCard>
                    ))}

                    {selectedStarterSession.notes && (
                      <GlassCard style={styles.detailNoteCard} depth="light">
                        <Text style={styles.detailNoteText}>{selectedStarterSession.notes}</Text>
                      </GlassCard>
                    )}

                    <View style={styles.detailButtons}>
                      <TouchableOpacity
                        style={styles.addProgramBtn}
                        onPress={() => {
                          createSession(selectedStarterSession as any);
                          setShowStarterDetails(false);
                          setMainTab('journey');
                        }}
                      >
                        <Plus color={colors.accent} size={16} />
                        <Text style={styles.addProgramBtnText}>Add to My Sessions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.startProgramBtn, { backgroundColor: meta.color }]}
                        onPress={() => handleStartStarterSession(selectedStarterSession)}
                      >
                        <Play color="#fff" size={16} fill="#fff" />
                        <Text style={styles.startProgramBtnText}>Start Now</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ height: 60 }} />
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}

      {/* Selected Session Detail Modal */}
      {selectedSession && (
        <Modal visible={!!selectedSession} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.detailModal}>
            <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={[styles.detailContent, { paddingTop: insets.top + 16 }]}>
              <TouchableOpacity onPress={() => setSelectedSession(null)} style={styles.detailClose}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
              {(() => {
                const meta = CATEGORY_META[selectedSession.category] || CATEGORY_META.healing;
                const IconComp = meta.icon;
                return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.detailHero}>
                      <LinearGradient colors={[meta.color + '40', meta.color + '10']} style={styles.detailHeroGrad}>
                        <View style={[styles.detailHeroIcon, { backgroundColor: meta.color + '30', borderColor: meta.color + '50' }]}>
                          <IconComp color={meta.color} size={32} />
                        </View>
                        <Text style={styles.detailName}>{selectedSession.name}</Text>
                        <Text style={styles.detailGoal}>{selectedSession.goal}</Text>
                        <View style={styles.detailMetaRow}>
                          <View style={styles.detailMetaChip}>
                            <Timer color={colors.textMuted} size={12} />
                            <Text style={styles.detailMetaChipText}>{selectedSession.totalDuration} min</Text>
                          </View>
                          <View style={styles.detailMetaChip}>
                            <Trophy color={colors.gold} size={12} />
                            <Text style={styles.detailMetaChipText}>{selectedSession.totalSessions} sessions</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                    <Text style={styles.detailSectionTitle}>Frequencies</Text>
                    {selectedSession.frequencies.map((f, i) => (
                      <GlassCard key={i} style={styles.freqItem} depth="light">
                        <View style={[styles.freqNumber, { backgroundColor: meta.color + '20' }]}>
                          <Text style={[styles.freqNumberText, { color: meta.color }]}>{i + 1}</Text>
                        </View>
                        <View style={styles.freqDetails}>
                          <Text style={styles.freqName}>{f.name}</Text>
                          <Text style={styles.freqHz}>{f.hz} Hz · {f.duration} min</Text>
                        </View>
                      </GlassCard>
                    ))}
                    <View style={styles.detailButtons}>
                      <TouchableOpacity
                        style={[styles.startProgramBtn, { backgroundColor: meta.color, flex: 1 }]}
                        onPress={() => handleStartSession(selectedSession)}
                      >
                        <Play color="#fff" size={16} fill="#fff" />
                        <Text style={styles.startProgramBtnText}>Start Session</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ height: 60 }} />
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}

      <AudioPlayer
        visible={showAudioPlayer}
        onClose={() => setShowAudioPlayer(false)}
        frequency={audioPlayerFrequency}
        sessionFrequencies={audioPlayerSession?.frequencies}
        sessionName={audioPlayerSession?.name}
        isSessionMode={!!audioPlayerSession}
      />
    </View>
  );
}

const createStyles = (colors: any, gradients: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  bgOrb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(108,99,255,0.12)',
    top: -60,
    right: -80,
    zIndex: 0,
  },
  bgOrb2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(167,139,250,0.08)',
    bottom: 200,
    left: -60,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  mainTabBar: {
    flexDirection: 'row',
    marginHorizontal: 22,
    backgroundColor: colors.glass,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 16,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  mainTabActive: {
    backgroundColor: 'rgba(108,99,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.5)',
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  mainTabTextActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  // Orb section
  orbSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  orbRingContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
  },
  sonarRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: 'rgba(108,99,255,0.5)',
  },
  orbOuterRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(108,99,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  orbMiddleRing: {
    width: 174,
    height: 174,
    borderRadius: 87,
    backgroundColor: 'rgba(108,99,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 36,
    elevation: 20,
  },
  orbGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 70,
  },
  orbContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  orbLabel: {
    fontFamily: FONTS.heading,
    fontSize: 13,
    fontWeight: '400' as const,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  orbFreqs: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
  },
  startSessionBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  startSessionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 13,
    gap: 8,
    borderRadius: 24,
  },
  startSessionBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  // Stats
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.divider,
  },
  // Challenge
  challengeCard: {
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  challengeGrad: {
    padding: 16,
    borderRadius: 18,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTextWrap: { flex: 1 },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  challengeDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  challengeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(108,99,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Week
  weekCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  weekCount: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayItem: { alignItems: 'center', gap: 6 },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  weekDotActive: {
    backgroundColor: 'rgba(108,99,255,0.25)',
    borderColor: 'rgba(108,99,255,0.5)',
  },
  weekDayLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabPillActive: {
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderColor: 'rgba(108,99,255,0.4)',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  tabPillTextActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  // Session cards
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    gap: 12,
  },
  sessionAccent: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sessionInfo: { flex: 1 },
  sessionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  sessionGoal: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionMetaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  intensityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
  },
  metaSep: {
    width: 1,
    height: 10,
    backgroundColor: colors.divider,
    marginHorizontal: 4,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Empty state
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    marginBottom: 16,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  // Achievements
  achievementsRow: {
    marginBottom: 16,
  },
  achievementsRowContent: {
    paddingRight: 22,
    gap: 10,
  },
  achievementsUnlocked: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600' as const,
  },
  achievementCard: {
    width: 108,
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    gap: 8,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  achievementUnlockedGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  achievementIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative' as const,
  },
  achievementCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  achievementProgressWrap: {
    width: '100%',
    gap: 4,
    alignItems: 'center',
  },
  achievementProgress: {
    width: '100%',
    height: 4,
    backgroundColor: colors.glass,
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementBar: {
    height: '100%',
    borderRadius: 2,
  },
  achievementPct: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  // Programs
  programsSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  programCard: {
    borderRadius: 22,
    marginBottom: 16,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  programTopBorder: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
  },
  programCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  programHeaderText: { flex: 1 },
  programIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  programCountText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  programGoal: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  programFreqPreview: {
    marginBottom: 14,
    gap: 6,
  },
  programFreqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programFreqDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  programFreqText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  programMoreText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500' as const,
    marginLeft: 13,
  },
  programFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  programMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  programMetaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  programScheduleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  programScheduleText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  programStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  programStartBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  // Detail Modal
  detailModal: { flex: 1 },
  detailContent: {
    flex: 1,
    paddingHorizontal: 22,
  },
  detailClose: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  detailHero: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  detailHeroGrad: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 24,
  },
  detailHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  detailGoal: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailMetaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  detailMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  detailMetaChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  freqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  freqNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqNumberText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  freqDetails: { flex: 1 },
  freqName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  freqHz: {
    fontSize: 12,
    color: colors.textMuted,
  },
  detailNoteCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  detailNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addProgramBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
  },
  addProgramBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  startProgramBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startProgramBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});

type SessionStyles = ReturnType<typeof createStyles>;
