import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  Clock3,
  Crown,
  Heart,
  LockKeyhole,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBackendData } from '@/hooks/useBackendData';
import { useFavorites } from '@/hooks/useFavorites';
import { useLearningContent } from '@/hooks/useLearningContent';
import { useTheme } from '@/hooks/useTheme';
import { useUsageAnalytics } from '@/hooks/useUsageAnalytics';
import { summarizeUsage } from '@/lib/analytics';
import { PremiumGate } from './PremiumGate';
import { GlassCard } from './GlassCard';
import { router } from 'expo-router';

type LibrarySection = 'favorites' | 'history' | 'listening' | 'bookmarks';

interface LibraryModalProps {
  visible: boolean;
  initialSection: LibrarySection;
  onClose: () => void;
}

const sections: { id: LibrarySection; label: string }[] = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'history', label: 'History' },
  { id: 'listening', label: 'Listening' },
  { id: 'bookmarks', label: 'Bookmarks' },
];

export const LibraryModal: React.FC<LibraryModalProps> = ({ visible, initialSection, onClose }) => {
  const { colors, gradients, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { user, userProfile, isPremium, isTrialActive } = useAuth();
  const { favorites } = useFavorites();
  const { progress } = useLearningContent();
  const { articles } = useBackendData();
  const [section, setSection] = useState<LibrarySection>(initialSection);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const hasPremiumView = isPremium || isTrialActive;
  const { events } = useUsageAnalytics(user?.uid, visible && section === 'listening' && hasPremiumView);

  React.useEffect(() => {
    if (!visible) return;
    const resetTimer = setTimeout(() => setSection(initialSection), 0);
    return () => clearTimeout(resetTimer);
  }, [initialSection, visible]);

  const bookmarkedArticles = useMemo(
    () => progress.favoriteArticles
      .map((id) => articles.find((article) => article.id === id))
      .filter(Boolean),
    [articles, progress.favoriteArticles]
  );
  const usageSummary = summarizeUsage(events, 'month');
  const usageTotal = userProfile?.usageStats?.totalListeningTime || 0;
  const history = userProfile?.usageStats?.sessionHistory || [];

  const openPremium = () => {
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
                <Text style={styles.eyebrow}>PERSONAL LIBRARY</Text>
                <Text style={styles.title}>Your practice, collected</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close library">
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {sections.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.tab, section === item.id && styles.tabActive]} onPress={() => setSection(item.id)}>
                  <Text style={[styles.tabText, section === item.id && styles.tabTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {section === 'favorites' && (
              <>
                <LibraryHero icon={Heart} title="Saved frequencies" subtitle="Your personal collection is synced to your account when cloud mode is enabled." styles={styles} colors={colors} count={favorites.length} />
                {favorites.length === 0 ? <EmptyState text="Tap the heart on any frequency to save it here." styles={styles} /> : favorites.map((favorite) => (
                  <TouchableOpacity key={favorite.hz} activeOpacity={0.85} onPress={() => { onClose(); router.push({ pathname: '/(tabs)/categories', params: { frequencyHz: String(favorite.hz) } } as any); }}>
                  <GlassCard style={styles.itemCard} depth="light">
                    <View style={[styles.itemIcon, { backgroundColor: '#F472B620' }]}><Heart color="#F472B6" size={18} fill="#F472B6" /></View>
                    <View style={styles.itemCopy}><Text style={styles.itemTitle}>{favorite.name}</Text><Text style={styles.itemSubtitle}>{favorite.hz} Hz{favorite.description ? ` · ${favorite.description}` : ''}</Text></View>
                  </GlassCard>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {section === 'history' && (
              <>
                <LibraryHero icon={CalendarDays} title="Session history" subtitle="Your completed practice days, recorded with your account profile." styles={styles} colors={colors} count={history.length} />
                {history.length === 0 ? <EmptyState text="Complete your first frequency session and it will appear here." styles={styles} /> : history.slice().reverse().map((date) => (
                  <GlassCard key={date} style={styles.itemCard} depth="light">
                    <View style={[styles.itemIcon, { backgroundColor: colors.gold + '20' }]}><CalendarDays color={colors.gold} size={18} /></View>
                    <View style={styles.itemCopy}><Text style={styles.itemTitle}>{formatDate(date)}</Text><Text style={styles.itemSubtitle}>Completed listening day</Text></View>
                  </GlassCard>
                ))}
              </>
            )}

            {section === 'listening' && (
              <>
                <LibraryHero icon={BarChart3} title="Listening time" subtitle="A calm view of your minutes, sessions, and recent rhythm." styles={styles} colors={colors} count={usageTotal} suffix=" min" />
                {!hasPremiumView ? (
                  <TouchableOpacity activeOpacity={0.9} onPress={openPremium}>
                    <GlassCard style={styles.lockedCard} depth="normal">
                      <LinearGradient colors={[colors.gold + '2E', colors.primary + '18']} style={styles.lockedGradient}>
                        <LockKeyhole color={colors.gold} size={21} />
                        <Text style={styles.lockedEyebrow}>PREMIUM VIEW</Text>
                        <Text style={styles.lockedTitle}>Reveal your listening rhythm</Text>
                        <Text style={styles.lockedText}>See detailed sessions, active days, and frequency patterns across the month.</Text>
                        <View style={styles.unlockRow}><Crown color={colors.gold} size={16} /><Text style={styles.unlockText}>Unlock analytics</Text></View>
                      </LinearGradient>
                    </GlassCard>
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.metricsRow}>
                      <Metric label="This month" value={`${usageSummary.minutes}m`} styles={styles} />
                      <Metric label="Sessions" value={`${usageSummary.sessions}`} styles={styles} />
                      <Metric label="Active days" value={`${usageSummary.activeDays}`} styles={styles} />
                    </View>
                    {events.length === 0 ? <EmptyState text="Complete a frequency session to build your listening journal." styles={styles} /> : events.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12).map((event) => (
                      <GlassCard key={event.id} style={styles.itemCard} depth="light">
                        <View style={[styles.itemIcon, { backgroundColor: colors.accentSoft }]}><Clock3 color={colors.accent} size={18} /></View>
                        <View style={styles.itemCopy}><Text style={styles.itemTitle}>{event.frequency}</Text><Text style={styles.itemSubtitle}>{formatDateTime(event.createdAt)}</Text></View><Text style={styles.duration}>{event.durationMinutes}m</Text>
                      </GlassCard>
                    ))}
                  </>
                )}
              </>
            )}

            {section === 'bookmarks' && (
              <>
                <LibraryHero icon={Bookmark} title="Bookmarked guides" subtitle="Saved learning content from your private reading library." styles={styles} colors={colors} count={progress.favoriteArticles.length} />
                {bookmarkedArticles.length === 0 ? <EmptyState text="Bookmark an article from Learn to build your reading library." styles={styles} /> : bookmarkedArticles.map((article: any) => (
                  <TouchableOpacity key={article.id} activeOpacity={0.85} onPress={() => { onClose(); router.push({ pathname: '/(tabs)/learn', params: { articleId: article.id } } as any); }}>
                  <GlassCard style={styles.itemCard} depth="light">
                    <View style={[styles.itemIcon, { backgroundColor: colors.accentSoft }]}><Bookmark color={colors.accent} size={18} fill={colors.accent} /></View>
                    <View style={styles.itemCopy}><Text style={styles.itemTitle}>{article.title}</Text><Text style={styles.itemSubtitle}>{article.category} · {article.readTime} min read</Text></View>
                  </GlassCard>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
      <PremiumGate visible={showPremiumGate} onClose={() => setShowPremiumGate(false)} feature="Listening analytics" description="See your listening rhythm, consistency, and frequency patterns across the month." icon={BarChart3} />
    </>
  );
};

function LibraryHero({ icon: Icon, title, subtitle, count, suffix = '', styles, colors }: any) {
  return <GlassCard style={styles.heroCard} depth="normal"><LinearGradient colors={[colors.accentSoft, colors.goldGlow]} style={styles.heroGradient}><View style={styles.heroIcon}><Icon color={colors.accent} size={20} /></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>{title}</Text><Text style={styles.heroSubtitle}>{subtitle}</Text></View><Text style={styles.heroCount}>{count}{suffix}</Text></LinearGradient></GlassCard>;
}

function Metric({ label, value, styles }: any) {
  return <GlassCard style={styles.metricCard} depth="light"><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></GlassCard>;
}

function EmptyState({ text, styles }: any) {
  return <View style={styles.empty}><Sparkles color="#A78BFA" size={20} /><Text style={styles.emptyText}>{text}</Text></View>;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingTop: 18, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', marginTop: 5, maxWidth: 290 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  tabs: { gap: 8, paddingBottom: 18 },
  tab: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass },
  tabActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent + '66' },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.accent },
  heroCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  heroGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  heroIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  heroSubtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  heroCount: { color: colors.gold, fontSize: 20, fontWeight: '700' },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 9, borderRadius: 16, gap: 12 },
  itemIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1 },
  itemTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  itemSubtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  duration: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  metricCard: { flex: 1, padding: 13, borderRadius: 14 },
  metricValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  metricLabel: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  lockedCard: { overflow: 'hidden', borderRadius: 18, marginTop: 4 },
  lockedGradient: { padding: 20 },
  lockedEyebrow: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 12 },
  lockedTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 5 },
  lockedText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16 },
  unlockText: { color: colors.gold, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 38, paddingHorizontal: 24 },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
});
