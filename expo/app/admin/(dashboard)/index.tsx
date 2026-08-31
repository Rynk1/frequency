import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Radio,
  BookOpen,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  Package,
  Database,
  Clock,
  Flame,
  Headphones,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useBackendData } from '@/hooks/useBackendData';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDataMode } from '@/hooks/useDataMode';

interface AnalyticsData {
  users: { total: number; premium: number; trial: number; free: number };
  content: { frequencies: number; curatedPrograms: number; articles: number };
  engagement: { totalListeningMinutes: number; totalSessionsCompleted: number; topStreakDays: number; activeSessions: number };
  revenue: { monthlyEstimate: number; yearlyEstimate: number };
  recentUsers: { id: string; email: string; displayName?: string; subscriptionStatus: string; createdAt?: any; sessionsCompleted: number; streakDays: number }[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  gradient: readonly [string, string];
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  gradient,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.statCard}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <LinearGradient
      colors={[...gradient]}
      style={styles.statGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statHeader}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {change && (
        <View style={styles.changeContainer}>
          <TrendingUp size={16} color="#10B981" />
          <Text style={styles.changeText}>{change}</Text>
        </View>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

export default function AdminDashboard() {
  const { frequencies, curatedPrograms, articles } = useBackendData();
  const { shouldUseFirestore } = useDataMode();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [premiumCount, setPremiumCount] = useState<number>(0);
  const [recentUsers, setRecentUsers] = useState<{ id: string; email: string; sub: string; createdAt?: any; sessionsCompleted?: number; streakDays?: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadUserStats = useCallback(async () => {
    if (!shouldUseFirestore) return;
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const all = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setUserCount(all.length);
      setPremiumCount(all.filter((u: any) => u.subscriptionStatus === 'premium').length);

      // Aggregate engagement metrics
      const totalListening = all.reduce((sum: number, u: any) =>
        sum + (u.usageStats?.totalListeningTime || 0), 0);
      const totalSessions = all.reduce((sum: number, u: any) =>
        sum + (u.usageStats?.sessionsCompleted || 0), 0);
      const topStreak = all.reduce((max: number, u: any) =>
        Math.max(max, u.usageStats?.streakDays || 0), 0);

      setAnalytics({
        users: {
          total: all.length,
          premium: all.filter((u: any) => u.subscriptionStatus === 'premium').length,
          trial: all.filter((u: any) => u.subscriptionStatus === 'trial').length,
          free: all.filter((u: any) => !u.subscriptionStatus || u.subscriptionStatus === 'free').length,
        },
        content: {
          frequencies: frequencies.length,
          curatedPrograms: curatedPrograms.length,
          articles: articles.length,
        },
        engagement: {
          totalListeningMinutes: totalListening,
          totalSessionsCompleted: totalSessions,
          topStreakDays: topStreak,
          activeSessions: curatedPrograms.length,
        },
        revenue: {
          monthlyEstimate: parseFloat((all.filter((u: any) => u.subscriptionStatus === 'premium').length * 9.99).toFixed(2)),
          yearlyEstimate: parseFloat((all.filter((u: any) => u.subscriptionStatus === 'premium').length * 95.99).toFixed(2)),
        },
        recentUsers: all
          .map((u: any) => ({
            id: u.id,
            email: u.email || 'Unknown',
            displayName: u.displayName,
            subscriptionStatus: u.subscriptionStatus || 'free',
            createdAt: u.createdAt,
            sessionsCompleted: u.usageStats?.sessionsCompleted || 0,
            streakDays: u.usageStats?.streakDays || 0,
          }))
          .sort((a: any, b: any) => {
            const aD = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const bD = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return bD.getTime() - aD.getTime();
          })
          .slice(0, 8),
      });

      const sorted = all
        .map((u: any) => ({
          id: u.id,
          email: u.email || 'Unknown',
          sub: u.subscriptionStatus || 'free',
          createdAt: u.createdAt,
          sessionsCompleted: u.usageStats?.sessionsCompleted || 0,
          streakDays: u.usageStats?.streakDays || 0,
        }))
        .sort((a, b) => {
          const aD = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const bD = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return bD.getTime() - aD.getTime();
        })
        .slice(0, 8);
      setRecentUsers(sorted);
      setLastUpdated(new Date());
    } catch (e) {
      console.warn('Failed to load user stats:', e);
    }
  }, [shouldUseFirestore, frequencies, curatedPrograms, articles]);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  // Auto-refresh every 30 seconds for live data
  useEffect(() => {
    if (!shouldUseFirestore) return;
    const interval = setInterval(() => {
      loadUserStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadUserStats, shouldUseFirestore]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserStats().finally(() => setRefreshing(false));
  }, [loadUserStats]);

  const revenueEstimate = analytics?.revenue.monthlyEstimate ?? premiumCount * 9.99;
  const totalListeningMin = analytics?.engagement.totalListeningMinutes ?? 0;
  const totalSessions = analytics?.engagement.totalSessionsCompleted ?? 0;
  const topStreak = analytics?.engagement.topStreakDays ?? 0;

  const stats = [
    {
      title: 'Total Users',
      value: shouldUseFirestore ? userCount : 'Cloud',
      change: shouldUseFirestore ? `${premiumCount} premium` : 'Switch to Cloud',
      icon: <Users color="white" size={24} />,
      gradient: ['#10B981', '#059669'] as const,
      route: '/admin/(dashboard)/users',
    },
    {
      title: 'Premium Users',
      value: shouldUseFirestore ? premiumCount : 'Cloud',
      change: shouldUseFirestore ? `${analytics?.users.trial ?? 0} on trial` : 'Switch to Cloud',
      icon: <DollarSign color="white" size={24} />,
      gradient: ['#F59E0B', '#D97706'] as const,
      route: '/admin/(dashboard)/users',
    },
    {
      title: 'Est. Revenue',
      value: shouldUseFirestore ? `$${revenueEstimate.toFixed(0)}` : 'Cloud',
      change: shouldUseFirestore ? 'Monthly' : 'Switch to Cloud',
      icon: <TrendingUp color="white" size={24} />,
      gradient: ['#8B5CF6', '#7C3AED'] as const,
      route: '/admin/(dashboard)/users',
    },
    {
      title: 'Total Frequencies',
      value: frequencies.length,
      change: 'Catalog',
      icon: <Radio color="white" size={24} />,
      gradient: ['#8B5CF6', '#7C3AED'] as const,
      route: '/admin/(dashboard)/frequencies',
    },
    {
      title: 'Curated Programs',
      value: curatedPrograms.length,
      change: 'Programs',
      icon: <Calendar color="white" size={24} />,
      gradient: ['#EC4899', '#DB2777'] as const,
      route: '/admin/(dashboard)/sessions',
    },
    {
      title: 'Learning Articles',
      value: articles.length,
      change: 'Published',
      icon: <BookOpen color="white" size={24} />,
      gradient: ['#3B82F6', '#2563EB'] as const,
      route: '/admin/(dashboard)/learning',
    },
    {
      title: 'Total Sessions',
      value: shouldUseFirestore ? totalSessions : 'Cloud',
      change: shouldUseFirestore ? 'Completed' : 'Switch to Cloud',
      icon: <Activity color="white" size={24} />,
      gradient: ['#06B6D4', '#0891B2'] as const,
    },
    {
      title: 'Listening Time',
      value: shouldUseFirestore ? `${Math.floor(totalListeningMin / 60)}h ${totalListeningMin % 60}m` : 'Cloud',
      change: shouldUseFirestore ? 'Total' : 'Switch to Cloud',
      icon: <Headphones color="white" size={24} />,
      gradient: ['#10B981', '#059669'] as const,
    },
    {
      title: 'Top Streak',
      value: shouldUseFirestore ? `${topStreak} days` : 'Cloud',
      change: shouldUseFirestore ? 'Best' : 'Switch to Cloud',
      icon: <Flame color="white" size={24} />,
      gradient: ['#F97316', '#EA580C'] as const,
    },
    {
      title: 'App Version',
      value: 'v2.1.0',
      change: 'Up to date',
      icon: <Package color="white" size={24} />,
      gradient: ['#6B7280', '#4B5563'] as const,
      route: '/admin/(dashboard)/settings',
    },
  ];

  const recentActivities = shouldUseFirestore && recentUsers.length > 0
    ? recentUsers.map((u) => ({
        id: u.id,
        action: u.sub === 'premium' ? 'Premium subscription' : u.sub === 'trial' ? 'Trial started' : 'New user registered',
        details: u.email,
        time: u.createdAt?.toDate
          ? formatTimeAgo(u.createdAt.toDate())
          : 'Recently',
        sessions: u.sessionsCompleted || 0,
        streak: u.streakDays || 0,
      }))
    : [
        { id: '1', action: 'No recent activity', details: shouldUseFirestore ? 'Waiting for users...' : 'Switch to Cloud mode', time: '', sessions: 0, streak: 0 },
      ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" />}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, Admin</Text>
        <View style={styles.headerRow}>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</Text>
          {lastUpdated && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live · {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            {...stat}
            onPress={stat.route ? () => router.push(stat.route as any) : undefined}
          />
        ))}
      </View>

      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <Activity color="#8B5CF6" size={24} />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        {recentActivities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[styles.activityDot, activity.action.includes('Premium') && { backgroundColor: '#F59E0B' }, activity.action.includes('Trial') && { backgroundColor: '#3B82F6' }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityAction}>{activity.action}</Text>
              <Text style={styles.activityDetails}>{activity.details}</Text>
              <View style={styles.activityMetaRow}>
                {activity.time ? <Text style={styles.activityTime}>{activity.time}</Text> : null}
                {activity.sessions > 0 && <Text style={styles.activityMeta}>· {activity.sessions} sessions</Text>}
                {activity.streak > 0 && <Text style={styles.activityMeta}>· {activity.streak} day streak</Text>}
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/(dashboard)/frequencies' as any)}
          >
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.actionGradient}>
              <Radio color="white" size={20} />
              <Text style={styles.actionText}>Add Frequency</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/(dashboard)/sessions' as any)}
          >
            <LinearGradient colors={['#EC4899', '#DB2777']} style={styles.actionGradient}>
              <Calendar color="white" size={20} />
              <Text style={styles.actionText}>Create Session</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/(dashboard)/learning' as any)}
          >
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.actionGradient}>
              <BookOpen color="white" size={20} />
              <Text style={styles.actionText}>Add Article</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.seedButton}
          onPress={() => Alert.alert(
            'Data Mode',
            shouldUseFirestore
              ? 'Cloud mode is active. Data is synced with Firebase Firestore in real-time. The dashboard auto-refreshes every 30 seconds.'
              : 'Local mode is active. Data is stored on-device via AsyncStorage. Switch to Cloud mode in the app Settings to enable Firebase sync and live analytics.'
          )}
        >
          <LinearGradient
            colors={shouldUseFirestore ? ['#059669', '#047857'] : ['#6B7280', '#4B5563']}
            style={styles.seedGradient}
          >
            <Database color="white" size={20} />
            <Text style={styles.seedText}>{shouldUseFirestore ? 'Cloud Data Mode · Live' : 'Local Data Mode'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);
  if (diffD > 0) return `${diffD}d ago`;
  if (diffH > 0) return `${diffH}h ago`;
  const diffM = Math.floor(diffMs / (1000 * 60));
  if (diffM > 0) return `${diffM}m ago`;
  return 'Just now';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20 },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  dateText: { fontSize: 14, color: '#9CA3AF' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { fontSize: 11, fontWeight: '600', color: '#10B981' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  statCard: { width: '50%', padding: 10 },
  statGradient: { borderRadius: 16, padding: 16 },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { marginRight: 8 },
  statTitle: { color: 'white', fontSize: 14, opacity: 0.9 },
  statValue: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  changeContainer: { flexDirection: 'row', alignItems: 'center' },
  changeText: { color: '#10B981', fontSize: 12, marginLeft: 4 },
  activitySection: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: 'white', marginLeft: 8 },
  activityItem: { flexDirection: 'row', marginBottom: 16, paddingLeft: 8 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', marginTop: 6, marginRight: 12 },
  activityContent: { flex: 1 },
  activityAction: { color: 'white', fontSize: 16, fontWeight: '500', marginBottom: 2 },
  activityDetails: { color: '#D1D5DB', fontSize: 14, marginBottom: 2 },
  activityMetaRow: { flexDirection: 'row', gap: 4 },
  activityTime: { color: '#6B7280', fontSize: 12 },
  activityMeta: { color: '#6B7280', fontSize: 12 },
  quickActions: { padding: 20 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  actionButton: { flex: 1, marginHorizontal: 4, borderRadius: 12, overflow: 'hidden' },
  actionGradient: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: 'white', fontSize: 12, fontWeight: '600', marginTop: 4 },
  seedButton: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  seedGradient: { paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  seedText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
