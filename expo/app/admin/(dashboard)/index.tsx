import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
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
  ShieldCheck,
  AlertTriangle,
  Receipt,
  FileText,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAdminData } from '@/hooks/useAdminData';
import { useDataMode } from '@/hooks/useDataMode';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  icon: React.ReactNode;
  gradient: readonly [string, string];
  onPress?: () => void;
  disabledMessage?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  icon,
  gradient,
  onPress,
  disabledMessage,
}) => (
  <TouchableOpacity
    style={styles.statCard}
    onPress={() => {
      if (disabledMessage) {
        Alert.alert(title, disabledMessage);
      } else if (onPress) {
        onPress();
      }
    }}
    activeOpacity={onPress || disabledMessage ? 0.7 : 1}
  >
    <LinearGradient
      colors={[...gradient]}
      style={styles.statGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statHeader}>
        <View style={styles.iconContainer}>{icon}</View>
        <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && (
        <View style={styles.changeContainer}>
          <Text style={styles.changeText} numberOfLines={1}>{subtitle}</Text>
        </View>
      )}
      {badge && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

export default function AdminDashboard() {
  const { frequencies, curatedPrograms, articles, isCloudAvailable } = useAdminData();
  const { mode, modeLabel, shouldUseFirestore } = useDataMode();
  const { analytics, isLoading, refreshing, lastUpdated, refreshAnalytics } = useAdminAnalytics();

  const handleRefresh = useCallback(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  const dataHealth = analytics?.dataHealth;
  const isLocalMode = mode === 'local';
  const isConnected = dataHealth?.connectionStatus === 'firestore_connected' || dataHealth?.connectionStatus === 'api_connected';

  const userMetrics = analytics?.users;
  const engagementMetrics = analytics?.engagement;
  const financialMetrics = analytics?.financial;
  const auditMetrics = analytics?.audit;
  const rankings = analytics?.rankings;

  const totalListeningMin = engagementMetrics?.totalListeningMinutes ?? 0;
  const listeningHoursText = isConnected
    ? `${Math.floor(totalListeningMin / 60)}h ${totalListeningMin % 60}m`
    : '--';

  const completedSessionsText = isConnected
    ? (engagementMetrics?.totalSessionsCompleted ?? 0).toString()
    : '--';

  const stats = [
    {
      title: 'Total Members',
      value: isConnected ? (userMetrics?.totalMembers ?? 0) : isLocalMode ? 'Local' : '--',
      subtitle: isConnected ? `${userMetrics?.premium.freeUsers ?? 0} free profiles` : isLocalMode ? 'Local mode active' : 'Cloud unavailable',
      icon: <Users color="white" size={24} />,
      gradient: ['#10B981', '#059669'] as const,
      route: '/admin/(dashboard)/users',
    },
    {
      title: 'Premium Entitlements',
      value: isConnected ? (userMetrics?.premium.activeEntitlements ?? 0) : isLocalMode ? 'Local' : '--',
      subtitle: isConnected ? `Verified subs: ${userMetrics?.premium.verifiedSubscriptions ?? 0}` : 'Cloud status required',
      icon: <DollarSign color="white" size={24} />,
      gradient: ['#F59E0B', '#D97706'] as const,
      route: '/admin/(dashboard)/users',
    },
    {
      title: 'Est. Revenue',
      value: '--',
      subtitle: 'Unavailable (Reconciliation required)',
      icon: <TrendingUp color="white" size={24} />,
      gradient: ['#6B7280', '#4B5563'] as const,
      disabledMessage: 'Revenue estimation from user count is strictly prohibited by matrix rules. Revenue requires direct provider reconciliation.',
    },
    {
      title: 'Verified Payments',
      value: financialMetrics?.paymentCount !== null && financialMetrics?.paymentCount !== undefined ? financialMetrics.paymentCount : '--',
      subtitle: financialMetrics?.paymentCount !== null ? 'Provider Ledger Events' : 'Unavailable',
      icon: <Receipt color="white" size={24} />,
      gradient: ['#059669', '#047857'] as const,
      disabledMessage: 'Payments count is derived exclusively from verified provider subscription events in Firestore.',
    },
    {
      title: 'Total Frequencies',
      value: frequencies.length,
      subtitle: isCloudAvailable ? 'Catalog (Firestore)' : 'Local Default Catalog',
      icon: <Radio color="white" size={24} />,
      gradient: ['#8B5CF6', '#7C3AED'] as const,
      route: '/admin/(dashboard)/frequencies',
    },
    {
      title: 'Curated Programs',
      value: curatedPrograms.length,
      subtitle: isCloudAvailable ? 'Programs (Firestore)' : 'Local Cached Programs',
      icon: <Calendar color="white" size={24} />,
      gradient: ['#EC4899', '#DB2777'] as const,
      route: '/admin/(dashboard)/sessions',
    },
    {
      title: 'Learning Articles',
      value: articles.length,
      subtitle: isCloudAvailable ? 'Published (Firestore)' : 'Local Cached Articles',
      icon: <BookOpen color="white" size={24} />,
      gradient: ['#3B82F6', '#2563EB'] as const,
      route: '/admin/(dashboard)/learning',
    },
    {
      title: 'Completed Sessions',
      value: completedSessionsText,
      subtitle: isConnected ? 'Canonical Completed Sessions' : 'Cloud Unavailable',
      icon: <Activity color="white" size={24} />,
      gradient: ['#06B6D4', '#0891B2'] as const,
      disabledMessage: 'Completed sessions are tracked via user stats & completed session records, excluding arbitrary audio tick events.',
    },
    {
      title: 'Listening Time',
      value: listeningHoursText,
      subtitle: isConnected ? 'Total Recorded Duration' : 'Cloud Unavailable',
      icon: <Headphones color="white" size={24} />,
      gradient: ['#10B981', '#059669'] as const,
    },
    {
      title: 'App Version',
      value: 'v2.1.0',
      subtitle: 'Production Hardened',
      icon: <Package color="white" size={24} />,
      gradient: ['#4B5563', '#374151'] as const,
      route: '/admin/(dashboard)/settings',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" />}
    >
      {/* Header & Status Strip */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Admin Overview</Text>

        {/* Backend Status Strip / Data Health Banner */}
        <View style={styles.healthBanner}>
          <View style={styles.healthRow}>
            <View style={styles.statusBadgeGroup}>
              <View
                style={[
                  styles.statusDot,
                  isConnected ? styles.dotConnected : isLocalMode ? styles.dotLocal : styles.dotError,
                ]}
              />
              <Text style={styles.statusBadgeText}>
                {isConnected
                  ? 'Firestore Connected'
                  : isLocalMode
                  ? 'Local Mode (Explicit)'
                  : 'Cloud Data Unavailable'}
              </Text>
            </View>

            <View style={styles.refreshInfo}>
              <Clock color="#9CA3AF" size={12} />
              <Text style={styles.refreshText}>
                {lastUpdated
                  ? `Refreshed ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Periodic (60s)`
                  : 'Updating...'}
              </Text>
            </View>
          </View>

          {dataHealth?.errorMessage && (
            <View style={styles.errorBanner}>
              <AlertTriangle color="#F59E0B" size={16} />
              <Text style={styles.errorText}>{dataHealth.errorMessage}</Text>
            </View>
          )}

          <View style={styles.healthDetailRow}>
            <Text style={styles.healthMetaText}>Source Mode: <Text style={styles.healthMetaBold}>{modeLabel}</Text></Text>
            <Text style={styles.healthMetaText}>Data Source: <Text style={styles.healthMetaBold}>{dataHealth?.source || 'Detecting...'}</Text></Text>
          </View>
        </View>
      </View>

      {/* Grid of Metric Cards */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            {...stat}
            onPress={stat.route ? () => router.push(stat.route as any) : undefined}
          />
        ))}
      </View>

      {/* Content Rankings & Activity Section */}
      <View style={styles.sectionContainer}>
        {/* Frequency Rankings */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Radio color="#8B5CF6" size={20} />
            <Text style={styles.sectionTitle}>Top Frequency Activity</Text>
          </View>

          {rankings?.frequencies && rankings.frequencies.length > 0 ? (
            rankings.frequencies.map((freq, idx) => (
              <View key={freq.frequencyKey || idx} style={styles.rankingRow}>
                <Text style={styles.rankNumber}>#{idx + 1}</Text>
                <View style={styles.rankContent}>
                  <Text style={styles.rankTitle}>{freq.name}</Text>
                  <Text style={styles.rankMeta}>{freq.sessionCount} user favorites / listening sessions</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptySectionText}>
              {isConnected ? 'No frequency listening activity recorded yet.' : 'Cloud connection required for live rankings.'}
            </Text>
          )}
        </View>

        {/* Verified Payment Ledger */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Receipt color="#10B981" size={20} />
            <Text style={styles.sectionTitle}>Recent Provider Payment Events</Text>
          </View>

          {financialMetrics?.recentPayments && financialMetrics.recentPayments.length > 0 ? (
            financialMetrics.recentPayments.map((pmt) => (
              <View key={pmt.id} style={styles.activityItem}>
                <View style={styles.activityDotGreen} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{pmt.eventType} · {pmt.productId}</Text>
                  <Text style={styles.activityDetails}>User {pmt.maskedUid} · State: {pmt.resultingState}</Text>
                  {pmt.timestamp && (
                    <Text style={styles.activityTime}>{pmt.timestamp.toLocaleString()}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptySectionText}>
              No verified provider payment events recorded in subscriptionEvents ledger.
            </Text>
          )}
        </View>

        {/* Audit Activity */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <ShieldCheck color="#3B82F6" size={20} />
            <Text style={styles.sectionTitle}>Recent Security Audit Activity</Text>
          </View>

          {auditMetrics?.recentLogs && auditMetrics.recentLogs.length > 0 ? (
            auditMetrics.recentLogs.map((log) => (
              <View key={log.id} style={styles.activityItem}>
                <View style={styles.activityDotBlue} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{log.action}</Text>
                  <Text style={styles.activityDetails}>By {log.adminEmail} on {log.resourceType}/{log.resourceId}</Text>
                  {log.createdAt && (
                    <Text style={styles.activityTime}>{log.createdAt.toLocaleString()}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptySectionText}>
              No admin audit entries recorded. Mutations performed in Cloud Functions write immutable audit logs.
            </Text>
          )}
        </View>
      </View>

      {/* Footer Info / Mode Selector Info */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.seedButton}
          onPress={() => Alert.alert(
            'Data Source & Architectural Authority',
            `Current Mode: ${modeLabel}\n\n` +
            `• Cloud Mode: Reads directly from Cloud Firestore authority. Fails visibly if unavailable.\n` +
            `• Auto Mode: Prefers Cloud Firestore data. If unavailable, displays explicit Stale/Unavailable state without fabricating fake metrics.\n` +
            `• Local Mode: Displays local on-device content only. Live operational metrics remain unavailable.\n\n` +
            `Revenue and payment counts are derived exclusively from verified provider transactions.`
          )}
        >
          <LinearGradient
            colors={isConnected ? ['#059669', '#047857'] : ['#4B5563', '#374151']}
            style={styles.seedGradient}
          >
            <Database color="white" size={20} />
            <Text style={styles.seedText}>Data Mode: {modeLabel} · {isConnected ? 'Firestore Connected' : 'Local / Offline'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20 },
  welcomeText: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  healthBanner: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  statusBadgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotConnected: { backgroundColor: '#10B981' },
  dotLocal: { backgroundColor: '#F59E0B' },
  dotError: { backgroundColor: '#EF4444' },
  statusBadgeText: { color: 'white', fontSize: 13, fontWeight: '600' },
  refreshInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { color: '#9CA3AF', fontSize: 11 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  errorText: { color: '#F3F4F6', fontSize: 12, flex: 1 },
  healthDetailRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 8, marginTop: 4 },
  healthMetaText: { color: '#9CA3AF', fontSize: 11 },
  healthMetaBold: { color: '#D1D5DB', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  statCard: { width: '50%', padding: 6 },
  statGradient: { borderRadius: 14, padding: 14 },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconContainer: { marginRight: 6 },
  statTitle: { color: 'white', fontSize: 13, opacity: 0.9, flex: 1 },
  statValue: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  changeContainer: { flexDirection: 'row', alignItems: 'center' },
  changeText: { color: '#E5E7EB', fontSize: 11, opacity: 0.8 },
  badgeContainer: { marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  sectionContainer: { paddingHorizontal: 16, marginTop: 10 },
  cardSection: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: 'white' },
  rankingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#111827', padding: 10, borderRadius: 8 },
  rankNumber: { color: '#8B5CF6', fontWeight: 'bold', fontSize: 14, width: 28 },
  rankContent: { flex: 1 },
  rankTitle: { color: 'white', fontSize: 14, fontWeight: '500' },
  rankMeta: { color: '#9CA3AF', fontSize: 12 },
  activityItem: { flexDirection: 'row', marginBottom: 10, paddingLeft: 4, alignItems: 'flex-start' },
  activityDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginTop: 5, marginRight: 10 },
  activityDotBlue: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginTop: 5, marginRight: 10 },
  activityContent: { flex: 1 },
  activityAction: { color: 'white', fontSize: 14, fontWeight: '500' },
  activityDetails: { color: '#9CA3AF', fontSize: 12, marginTop: 1 },
  activityTime: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  emptySectionText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  quickActions: { padding: 16, paddingTop: 0, marginBottom: 20 },
  seedButton: { borderRadius: 12, overflow: 'hidden' },
  seedGradient: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  seedText: { color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 8 },
});
