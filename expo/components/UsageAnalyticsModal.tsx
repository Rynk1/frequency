import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, CalendarDays, ChevronRight, Clock3, Crown, Headphones, LockKeyhole, Sparkles, Timer, TrendingUp, X, Zap } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useUsageAnalytics } from '@/hooks/useUsageAnalytics';
import { AnalyticsPeriod, summarizeUsage, UsageEvent } from '@/lib/analytics';
import { useTheme } from '@/hooks/useTheme';
import { GlassCard } from './GlassCard';
import { PremiumGate } from './PremiumGate';

interface UsageAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
}

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
];

export const UsageAnalyticsModal: React.FC<UsageAnalyticsModalProps> = ({ visible, onClose }) => {
  const { colors, gradients, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { user, isPremium, isTrialActive } = useAuth();
  const [period, setPeriod] = useState<AnalyticsPeriod>('day');
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const hasAccess = isPremium || isTrialActive;
  const { events } = useUsageAnalytics(user?.uid, visible && hasAccess);
  const summary = summarizeUsage(events, period);
  const maxMinutes = Math.max(...summary.dailyMinutes, 1);
  const visibleHistory = events
    .filter((event) => {
      const currentSummary = summarizeUsage([event], period);
      return currentSummary.sessions > 0;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleOpen = () => {
    if (hasAccess) return;
    setShowPremiumGate(true);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.container}>
          <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>Personal resonance</Text>
                <Text style={styles.title}>Your analytics</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close analytics">
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={handleOpen} disabled={hasAccess}>
              <GlassCard style={styles.heroCard} depth="normal">
                <LinearGradient colors={['rgba(212,175,55,0.24)', 'rgba(108,99,255,0.12)']} style={styles.heroGradient}>
                  <View style={styles.heroIcon}><TrendingUp color={colors.gold} size={20} /></View>
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroTitle}>{hasAccess ? 'A clearer view of your practice' : 'Unlock your practice pattern'}</Text>
                    <Text style={styles.heroText}>{hasAccess ? 'Small, consistent sessions add up.' : 'Premium reveals your listening rhythm across every time horizon.'}</Text>
                  </View>
                  {!hasAccess && <Crown color={colors.gold} size={18} />}
                </LinearGradient>
              </GlassCard>
            </TouchableOpacity>

            <View style={styles.periodTabs} accessibilityRole="tablist">
              {PERIODS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.periodTab, period === item.id && styles.periodTabActive]}
                  onPress={() => setPeriod(item.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: period === item.id }}
                >
                  <Text style={[styles.periodText, period === item.id && styles.periodTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {hasAccess ? (
              summary.sessions === 0 ? (
                <EmptyAnalyticsState period={period} styles={styles} colors={colors} />
              ) : (
                <>
                    <View style={styles.metricsGrid}>
                      <Metric icon={Timer} value={`${summary.minutes}`} label="Minutes" styles={styles} color={colors.accent} />
                      <Metric icon={Headphones} value={`${summary.sessions}`} label="Sessions" styles={styles} color={colors.gold} />
                      <Metric icon={CalendarDays} value={`${summary.activeDays}`} label="Active days" styles={styles} color="#34D399" />
                    </View>

                    <GlassCard style={styles.chartCard} depth="light">
                      <View style={styles.cardHeader}>
                        <View>
                          <Text style={styles.cardEyebrow}>Listening rhythm</Text>
                          <Text style={styles.cardTitle}>{period === 'day' ? 'Today' : period === 'week' ? 'Daily minutes' : 'Monthly minutes'}</Text>
                        </View>
                        <BarChart3 color={colors.accent} size={20} />
                      </View>
                      <View style={styles.chart}>
                        {summary.dailyMinutes.map((minutes, index) => (
                          <View key={index} style={styles.barColumn}>
                            <View style={styles.barTrack}>
                              <View style={[styles.bar, { height: `${Math.max(minutes / maxMinutes, minutes ? 0.08 : 0) * 100}%` }]} />
                            </View>
                            {(period !== 'month' || index % 5 === 0) && <Text style={styles.barLabel}>{period === 'day' ? 'Now' : period === 'week' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] : index + 1}</Text>}
                          </View>
                        ))}
                      </View>
                    </GlassCard>

                    <GlassCard style={styles.insightCard} depth="light">
                      <Zap color={colors.gold} size={18} />
                      <View style={styles.insightCopy}>
                        <Text style={styles.cardEyebrow}>Personal insight</Text>
                        <Text style={styles.insightText}>
                          {summary.topFrequency ? `${summary.topFrequency} is your strongest frequency in this period.` : 'Complete a session to reveal your first listening pattern.'}
                        </Text>
                      </View>
                    </GlassCard>
                    <HistoryCard events={visibleHistory} styles={styles} colors={colors} period={period} />
                </>
              )
            ) : (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setShowPremiumGate(true)}>
                <GlassCard style={styles.lockedCard} depth="normal">
                  <LinearGradient colors={['rgba(212,175,55,0.18)', 'rgba(108,99,255,0.14)']} style={styles.lockedGradient}>
                    <View style={styles.lockIcon}><LockKeyhole color={colors.gold} size={19} /></View>
                    <Text style={styles.lockedEyebrow}>Premium view</Text>
                    <Text style={styles.lockedTitle}>{period === 'day' ? "Today's" : period === 'week' ? "This week's" : "This month's"} listening story</Text>
                    <Text style={styles.lockedText}>See your sessions, minutes, consistency, and listening history in one calm, private view.</Text>
                    <View style={styles.unlockRow}>
                      <Sparkles color={colors.gold} size={15} />
                      <Text style={styles.unlockText}>Unlock personal analytics</Text>
                      <ChevronRight color={colors.gold} size={16} />
                    </View>
                  </LinearGradient>
                </GlassCard>
              </TouchableOpacity>
            )}
            <View style={styles.bottomSpace} />
          </ScrollView>
        </View>
      </Modal>

      <PremiumGate
        visible={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="Personal analytics"
        description="See your listening rhythm, consistency, and favorite frequencies across the day, week, and month."
        icon={TrendingUp}
      />
    </>
  );
};

function Metric({ icon: Icon, value, label, styles, color }: { icon: React.ComponentType<any>; value: string; label: string; styles: ReturnType<typeof createStyles>; color: string }) {
  return (
    <GlassCard style={styles.metricCard} depth="light">
      <Icon color={color} size={17} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </GlassCard>
  );
}

function EmptyAnalyticsState({ period, styles, colors }: { period: AnalyticsPeriod; styles: ReturnType<typeof createStyles>; colors: any }) {
  const periodLabel = period === 'day' ? 'today' : period === 'week' ? 'this week' : 'this month';
  return (
    <GlassCard style={styles.emptyCard} depth="light">
      <View style={styles.emptyIcon}><Sparkles color={colors.gold} size={20} /></View>
      <Text style={styles.emptyTitle}>Your {periodLabel} is still unfolding</Text>
      <Text style={styles.emptyText}>Complete a frequency session and your minutes, patterns, and history will appear here.</Text>
      <View style={styles.emptyRule} />
      <Text style={styles.emptyHint}>Your private listening journal</Text>
    </GlassCard>
  );
}

function HistoryCard({ events, styles, colors, period }: { events: UsageEvent[]; styles: ReturnType<typeof createStyles>; colors: any; period: AnalyticsPeriod }) {
  return (
    <GlassCard style={styles.historyCard} depth="light">
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardEyebrow}>Listening history</Text>
          <Text style={styles.cardTitle}>{period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month'}</Text>
        </View>
        <Clock3 color={colors.gold} size={19} />
      </View>
      {events.slice(0, 6).map((event) => (
        <View key={event.id} style={styles.historyRow}>
          <View style={styles.historyDot} />
          <View style={styles.historyCopy}>
            <Text style={styles.historyFrequency} numberOfLines={1}>{event.frequency}</Text>
            <Text style={styles.historyDate}>{formatEventDate(event.createdAt)}</Text>
          </View>
          <Text style={styles.historyDuration}>{event.durationMinutes} min</Text>
        </View>
      ))}
      {events.length > 6 && <Text style={styles.historyMore}>Showing your six most recent sessions</Text>}
    </GlassCard>
  );
}

function formatEventDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingTop: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: '700', marginTop: 4 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  heroCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 18 },
  heroGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.goldGlow, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  heroText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  periodTabs: { flexDirection: 'row', backgroundColor: colors.glass, borderRadius: 14, padding: 3, borderWidth: 1, borderColor: colors.glassBorder, marginBottom: 16 },
  periodTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  periodTabActive: { backgroundColor: isDark ? colors.accentSoft : 'rgba(108,99,255,0.18)' },
  periodText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  periodTextActive: { color: colors.accent },
  metricsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricCard: { flex: 1, paddingVertical: 15, paddingHorizontal: 8, alignItems: 'center', borderRadius: 14 },
  metricValue: { color: colors.textPrimary, fontSize: 21, fontWeight: '800', marginTop: 7 },
  metricLabel: { color: colors.textMuted, fontSize: 10, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  chartCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardEyebrow: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: '700' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 4 },
  chart: { height: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barTrack: { width: '70%', height: '85%', justifyContent: 'flex-end', backgroundColor: colors.glass, borderRadius: 5, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: colors.accent, borderRadius: 5, minHeight: 2 },
  barLabel: { color: colors.textMuted, fontSize: 9, marginTop: 6 },
  insightCard: { borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  insightCopy: { flex: 1 },
  insightText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
  emptyCard: { borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.goldGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, maxWidth: 290 },
  emptyRule: { width: 42, height: 1, backgroundColor: colors.gold, opacity: 0.55, marginVertical: 18 },
  emptyHint: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  lockedCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  lockedGradient: { padding: 22, alignItems: 'center' },
  lockIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.goldGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  lockedEyebrow: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  lockedTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 7 },
  lockedText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, maxWidth: 300 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 20, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.goldGlow },
  unlockText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  historyCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.divider },
  historyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginRight: 11 },
  historyCopy: { flex: 1 },
  historyFrequency: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  historyDate: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  historyDuration: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  historyMore: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  bottomSpace: { height: 30 },
});

export default UsageAnalyticsModal;
