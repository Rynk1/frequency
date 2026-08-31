import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import {
  Volume2,
  Clock,
  Heart,
  Info,
  Star,
  Shield,
  Crown,
  User,
  LogOut,
  ChevronRight,
  Settings,
  Bell,
  Headphones,
  Zap,
  Sparkles,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react-native';
import { useSettings } from '@/hooks/useSettings';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { PremiumModal } from '@/components/PremiumModal';
import { DataModeIndicator } from '@/components/DataModeIndicator';
import { router } from 'expo-router';
import { FONTS } from '@/constants/theme';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 44 - 32 - 22;

const GlassCard = SharedGlassCard;

interface GlowSliderProps {
  value: number;
  onValueChange: (v: number) => void;
  accentColor?: string;
  trackColor?: string;
  borderColor?: string;
}

const GlowSlider: React.FC<GlowSliderProps> = ({
  value,
  onValueChange,
  accentColor = '#6C63FF',
  trackColor = 'rgba(0,0,0,0.06)',
  borderColor = 'rgba(0,0,0,0.08)',
}) => {
  const positionX = useRef(new Animated.Value(value * SLIDER_WIDTH)).current;
  const posRef = useRef(value * SLIDER_WIDTH);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const newPos = Math.max(0, Math.min(SLIDER_WIDTH, value * SLIDER_WIDTH));
    posRef.current = newPos;
    Animated.timing(positionX, {
      toValue: newPos,
      duration: 120,
      useNativeDriver: false,
    }).start();
  }, [value, positionX]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true }).start();
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, evt.nativeEvent.locationX));
      posRef.current = newX;
      positionX.setValue(newX);
      onValueChange(newX / SLIDER_WIDTH);
    },
    onPanResponderMove: (_, g) => {
      const newPos = Math.max(0, Math.min(SLIDER_WIDTH, posRef.current + g.dx));
      positionX.setValue(newPos);
      onValueChange(newPos / SLIDER_WIDTH);
    },
    onPanResponderRelease: (_, g) => {
      const newPos = Math.max(0, Math.min(SLIDER_WIDTH, posRef.current + g.dx));
      posRef.current = newPos;
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    },
  });

  const thumbLeft = positionX.interpolate({
    inputRange: [0, SLIDER_WIDTH],
    outputRange: [0, SLIDER_WIDTH],
    extrapolate: 'clamp',
  });

  const fillWidth = positionX.interpolate({
    inputRange: [0, SLIDER_WIDTH],
    outputRange: [0, SLIDER_WIDTH],
    extrapolate: 'clamp',
  });

  return (
    <View style={sliderStyles.container}>
      <View style={[sliderStyles.track, { backgroundColor: trackColor, borderColor }]}>
        <Animated.View style={[sliderStyles.fill, { width: fillWidth, backgroundColor: accentColor }]} />
      </View>
      <Animated.View
        style={[sliderStyles.thumb, { left: thumbLeft, transform: [{ scale: scaleAnim }], backgroundColor: accentColor, shadowColor: accentColor }]}
        {...panResponder.panHandlers}
      />
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  container: { height: 32, justifyContent: 'center', marginVertical: 4 },
  track: { height: 5, borderRadius: 3, overflow: 'visible', position: 'relative', borderWidth: 1, marginHorizontal: 11 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
  thumb: { position: 'absolute', width: 22, height: 22, borderRadius: 11, top: -9, marginLeft: -11, borderWidth: 2, borderColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 8 },
});

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();
  const { favorites } = useFavorites();
  const { user, userProfile, isPremium, isTrialActive, trialDaysLeft, signOut } = useAuth();
  const { mode, colors, gradients, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showPremiumModal, setShowPremiumModal] = React.useState(false);

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
  };

  const getSubscriptionStatus = () => {
    if (isPremium) return 'Premium Active';
    if (isTrialActive) return `Free Trial · ${trialDaysLeft} days left`;
    return 'Free Plan';
  };

  const membershipGradient: readonly [string, string] = isPremium
    ? ['rgba(212,175,55,0.35)', 'rgba(245,208,96,0.12)'] as const
    : isTrialActive
      ? ['rgba(108,99,255,0.3)', 'rgba(167,139,250,0.1)'] as const
      : isDark
        ? ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)'] as const
        : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)'] as const;

  const membershipBadgeColor = isPremium ? colors.gold : isTrialActive ? colors.accent : colors.textMuted;

  const islandIconBg = (color: string) => ({
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : `${color}12`,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : `${color}25`,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={gradients.bg as any} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={[styles.ambientOrb, { backgroundColor: isDark ? 'rgba(108,99,255,0.09)' : 'rgba(108,99,255,0.06)' }]} pointerEvents="none" />
      <View style={[styles.ambientOrb2, { backgroundColor: isDark ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.04)' }]} pointerEvents="none" />
      <View style={[styles.ambientOrb3, { backgroundColor: isDark ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.03)' }]} pointerEvents="none" />

      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerEyebrow, { color: colors.textMuted }]}>Preferences</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* — MEMBERSHIP CARD — */}
          <GlassCard style={styles.membershipCard} depth="normal">
            <LinearGradient colors={membershipGradient} style={styles.membershipGrad}>
              <View style={styles.membershipTop}>
                <View>
                  <Text style={[styles.membershipLabel, { color: colors.textMuted }]}>Islands</Text>
                  <Text style={[styles.membershipTitle, { color: colors.textPrimary }]}>Membership Card</Text>
                </View>
                <View style={[styles.membershipCrown, { backgroundColor: membershipBadgeColor + '20', borderColor: membershipBadgeColor + '40' }]}>
                  <Crown color={membershipBadgeColor} size={16} />
                </View>
              </View>
              <View style={[styles.membershipDivider, { backgroundColor: colors.dividerBright }]} />
              <View style={styles.membershipBottom}>
                <View>
                  <Text style={[styles.membershipAccountLabel, { color: colors.textMuted }]}>Account</Text>
                  <Text style={[styles.membershipEmail, { color: colors.textPrimary }]}>{user?.email || 'HarmonyFrequency'}</Text>
                </View>
                <View style={[styles.membershipStatusBadge, { backgroundColor: membershipBadgeColor + '20', borderColor: membershipBadgeColor + '40' }]}>
                  <Text style={[styles.membershipStatusText, { color: membershipBadgeColor }]}>{getSubscriptionStatus()}</Text>
                </View>
              </View>

              {!isPremium && (
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={() => setShowPremiumModal(true)}
                >
                  <LinearGradient
                    colors={['rgba(212,175,55,0.9)', 'rgba(245,208,96,0.85)']}
                    style={styles.upgradeBtnGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Crown color="#1a1200" size={14} />
                    <Text style={styles.upgradeBtnText}>
                      {isTrialActive ? `Upgrade — ${trialDaysLeft} days left` : 'Upgrade to Premium'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </GlassCard>

          {/* — GROUPED: Appearance — */}
          <Text style={[styles.islandLabel, { color: colors.textMuted }]}>Appearance</Text>
          <GlassCard style={styles.island} depth="normal">
            <View style={styles.islandRow}>
              <View style={[styles.islandIcon, islandIconBg(colors.accent)]}>
                {isDark ? <Moon color={colors.accent} size={18} /> : <Sun color={colors.accent} size={18} />}
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Theme</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>
                  {isDark ? 'Dark mode' : 'Light mode'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[
                  styles.themeToggle,
                  {
                    backgroundColor: isDark ? 'rgba(108,99,255,0.15)' : 'rgba(255,200,50,0.15)',
                    borderColor: isDark ? 'rgba(108,99,255,0.3)' : 'rgba(255,200,50,0.3)',
                  },
                ]}
              >
                <Animated.View style={[styles.themeToggleThumb, { backgroundColor: isDark ? colors.accent : '#FBBF24' }]}>
                  {isDark ? <Moon color="#fff" size={12} /> : <Sun color="#fff" size={12} />}
                </Animated.View>
                <Text style={[styles.themeToggleText, { color: isDark ? colors.accent : '#FBBF24' }]}>
                  {isDark ? 'Dark' : 'Light'}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* — GROUPED: Account — */}
          <Text style={[styles.islandLabel, { color: colors.textMuted }]}>Account</Text>
          <GlassCard style={styles.island} depth="normal">
            <TouchableOpacity style={styles.islandRow}>
              <View style={[styles.islandIcon, islandIconBg(colors.accent)]}>
                <User color={colors.accent} size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>{user?.email || 'User Account'}</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>{userProfile?.usageStats?.sessionsCompleted || 0} sessions · {userProfile?.usageStats?.streakDays || 0} day streak</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />
            <TouchableOpacity style={styles.islandRow} onPress={handleSignOut}>
              <View style={[styles.islandIcon, islandIconBg('#F87171')]}>
                <LogOut color="#F87171" size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: '#F87171' }]}>Sign Out</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>Sign out of your account</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} />
            </TouchableOpacity>
          </GlassCard>

          {/* — GROUPED: Audio — */}
          <Text style={[styles.islandLabel, { color: colors.textMuted }]}>Audio</Text>
          <GlassCard style={styles.island} depth="normal">
            <View style={styles.sliderRow}>
              <View style={styles.sliderRowHeader}>
                <View style={[styles.islandIcon, islandIconBg('#60A5FA')]}>
                  <Volume2 color="#60A5FA" size={18} />
                </View>
                <View style={styles.islandText}>
                  <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Volume</Text>
                </View>
                <Text style={[styles.sliderValue, { color: '#60A5FA' }]}>{Math.round(settings.volume * 100)}%</Text>
              </View>
              <View style={styles.sliderWrap}>
                <GlowSlider
                  value={settings.volume}
                  onValueChange={(v) => updateSetting('volume', v)}
                  accentColor="#60A5FA"
                  trackColor={colors.glass}
                  borderColor={colors.glassBorder}
                />
              </View>
            </View>

            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />

            <View style={styles.islandRow}>
              <View style={[styles.islandIcon, islandIconBg('#34D399')]}>
                <Headphones color="#34D399" size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Background Audio</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>Continue playing when minimized</Text>
              </View>
              <Switch
                value={settings.backgroundAudio}
                onValueChange={(v) => updateSetting('backgroundAudio', v)}
                trackColor={{ false: colors.glass, true: 'rgba(52,211,153,0.5)' }}
                thumbColor={settings.backgroundAudio ? '#34D399' : colors.textMuted}
              />
            </View>
          </GlassCard>

          {/* — GROUPED: Notifications — */}
          <Text style={[styles.islandLabel, { color: colors.textMuted }]}>Notifications</Text>
          <GlassCard style={styles.island} depth="normal">
            <View style={styles.islandRow}>
              <View style={[styles.islandIcon, islandIconBg('#FBBF24')]}>
                <Bell color="#FBBF24" size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Daily Reminders</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>Get reminded to start your session</Text>
              </View>
              <Switch
                value={settings.autoStop}
                onValueChange={(v) => updateSetting('autoStop', v)}
                trackColor={{ false: colors.glass, true: 'rgba(251,191,36,0.5)' }}
                thumbColor={settings.autoStop ? '#FBBF24' : colors.textMuted}
              />
            </View>
            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />
            <View style={styles.islandRow}>
              <View style={[styles.islandIcon, islandIconBg(colors.accent)]}>
                <Sparkles color={colors.accent} size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Streak Alerts</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>Notify when streak is at risk</Text>
              </View>
              <Switch
                value={settings.backgroundAudio}
                onValueChange={(v) => updateSetting('backgroundAudio', v)}
                trackColor={{ false: colors.glass, true: 'rgba(167,139,250,0.5)' }}
                thumbColor={settings.backgroundAudio ? colors.accent : colors.textMuted}
              />
            </View>
          </GlassCard>

          {/* — GROUPED: Sessions — */}
          <Text style={[styles.islandLabel, { color: colors.textMuted }]}>Sessions</Text>
          <GlassCard style={styles.island} depth="normal">
            <View style={styles.islandRow}>
              <View style={[styles.islandIcon, islandIconBg('#FBBF24')]}>
                <Clock color="#FBBF24" size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Auto-stop Timer</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>Stop sessions after set time</Text>
              </View>
              <Switch
                value={settings.autoStop}
                onValueChange={(v) => updateSetting('autoStop', v)}
                trackColor={{ false: colors.glass, true: 'rgba(251,191,36,0.5)' }}
                thumbColor={settings.autoStop ? '#FBBF24' : colors.textMuted}
              />
            </View>
            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />
            <View style={styles.islandRow}>
              <View style={[styles.islandIcon, islandIconBg(colors.accent)]}>
                <Zap color={colors.accent} size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Default Session Length</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>{settings.defaultSessionLength} minutes</Text>
              </View>
              <View style={styles.sessionLengthPicker}>
                {[10, 20, 30].map((len) => (
                  <TouchableOpacity
                    key={len}
                    style={[
                      styles.lengthChip,
                      { backgroundColor: colors.glass, borderColor: colors.glassBorder },
                      settings.defaultSessionLength === len && { backgroundColor: colors.accentSoft, borderColor: colors.accent + '50' },
                    ]}
                    onPress={() => updateSetting('defaultSessionLength', len)}
                  >
                    <Text style={[
                      styles.lengthChipText,
                      { color: colors.textMuted },
                      settings.defaultSessionLength === len && { color: colors.accent },
                    ]}>{len}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </GlassCard>

          {/* — GROUPED: Library — */}
          <Text style={[styles.islandLabel, { color: colors.textMuted }]}>Your Library</Text>
          <GlassCard style={styles.island} depth="normal">
            <TouchableOpacity style={styles.islandRow} onPress={() => router.push('/(tabs)/categories' as any)}>
              <View style={[styles.islandIcon, islandIconBg('#F472B6')]}>
                <Heart color="#F472B6" size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Favorites</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>{favorites.length} saved frequencies</Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <Text style={[styles.statBadgeText, { color: '#F472B6' }]}>{favorites.length}</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />
            <TouchableOpacity style={styles.islandRow} onPress={() => router.push('/(tabs)/sessions' as any)}>
              <View style={[styles.islandIcon, islandIconBg(colors.gold)]}>
                <Star color={colors.gold} size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Session History</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>{userProfile?.usageStats?.sessionsCompleted || 0} total sessions</Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: colors.gold + '15', borderColor: colors.gold + '30' }]}>
                <Text style={[styles.statBadgeText, { color: colors.gold }]}>{userProfile?.usageStats?.sessionsCompleted || 0}</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />
            <TouchableOpacity style={styles.islandRow} onPress={() => router.push('/(tabs)/sessions' as any)}>
              <View style={[styles.islandIcon, islandIconBg('#60A5FA')]}>
                <TrendingUp color="#60A5FA" size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Listening Time</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>{userProfile?.usageStats?.totalListeningTime || 0} minutes total</Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: '#60A5FA15', borderColor: '#60A5FA30' }]}>
                <Text style={[styles.statBadgeText, { color: '#60A5FA' }]}>{userProfile?.usageStats?.totalListeningTime || 0}m</Text>
              </View>
            </TouchableOpacity>
          </GlassCard>

          {/* — GROUPED: Data Mode — */}
          <Text style={[styles.islandLabel, { color: colors.textMuted }]}>Data Mode</Text>
          <GlassCard style={styles.island} depth="normal">
            <View style={[styles.islandRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <DataModeIndicator compact={false} showPicker />
            </View>
          </GlassCard>

          {/* — GROUPED: Settings — */}
          <Text style={[styles.islandLabel, { color: colors.textMuted }]}>Settings</Text>
          <GlassCard style={styles.island} depth="normal">
            <TouchableOpacity style={styles.islandRow} onPress={() => router.push('/setup' as any)}>
              <View style={[styles.islandIcon, islandIconBg(colors.textSecondary)]}>
                <Settings color={colors.textSecondary} size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Account Settings</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>Manage preferences</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} />
            </TouchableOpacity>
            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />
            <TouchableOpacity style={styles.islandRow} onPress={() => router.push('/admin/login' as any)}>
              <View style={[styles.islandIcon, islandIconBg(colors.textSecondary)]}>
                <Shield color={colors.textSecondary} size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Admin Panel</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>Access admin dashboard</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} />
            </TouchableOpacity>
            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />
            <TouchableOpacity
              style={styles.islandRow}
              onPress={() => Alert.alert(
                'Privacy Policy',
                'Harmony Frequency values your privacy. We store your session data, preferences, and usage statistics securely in Firebase. We do not share your data with third parties. Audio sessions are generated locally on your device. You can delete your account and all associated data at any time by signing out and contacting support.'
              )}
            >
              <View style={[styles.islandIcon, islandIconBg(colors.textSecondary)]}>
                <Info color={colors.textSecondary} size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>Review our privacy terms</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} />
            </TouchableOpacity>
            <View style={[styles.islandSep, { backgroundColor: colors.divider }]} />
            <View style={styles.islandRow}>
              <View style={[styles.islandIcon, islandIconBg(colors.textMuted)]}>
                <Info color={colors.textMuted} size={18} />
              </View>
              <View style={styles.islandText}>
                <Text style={[styles.islandRowTitle, { color: colors.textPrimary }]}>App Version</Text>
                <Text style={[styles.islandRowSub, { color: colors.textMuted }]}>1.0.0</Text>
              </View>
            </View>
          </GlassCard>

        </ScrollView>
      </View>

      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  ambientOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -50, right: -70 },
  ambientOrb2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: 350, left: -40 },
  ambientOrb3: { position: 'absolute', width: 130, height: 130, borderRadius: 65, bottom: 150, right: -20 },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
  headerEyebrow: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 32, fontWeight: '700' as const, letterSpacing: 0.2 },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 16 },
  membershipCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24 },
  membershipGrad: { padding: 20, borderRadius: 24 },
  membershipTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  membershipLabel: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 },
  membershipTitle: { fontSize: 20, fontWeight: '700' as const, letterSpacing: 0.2 },
  membershipCrown: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  membershipDivider: { height: 1, marginBottom: 14 },
  membershipBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  membershipAccountLabel: { fontSize: 11, letterSpacing: 0.5, marginBottom: 3 },
  membershipEmail: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.1 },
  membershipStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  membershipStatusText: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.2 },
  upgradeBtn: { borderRadius: 14, overflow: 'hidden', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  upgradeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 8, borderRadius: 14 },
  upgradeBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#1a1200', letterSpacing: 0.2 },
  islandLabel: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  island: { borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
  islandRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  islandIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  islandText: { flex: 1 },
  islandRowTitle: { fontSize: 15, fontWeight: '600' as const, marginBottom: 2, letterSpacing: 0.1 },
  islandRowSub: { fontSize: 12, lineHeight: 16 },
  islandSep: { height: 1, marginHorizontal: 16 },
  statBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statBadgeText: { fontSize: 12, fontWeight: '700' as const },
  sliderRow: { paddingHorizontal: 16, paddingVertical: 14 },
  sliderRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sliderValue: { fontSize: 13, fontWeight: '600' as const, minWidth: 36, textAlign: 'right' },
  sliderWrap: { paddingHorizontal: 0 },
  sessionLengthPicker: { flexDirection: 'row', gap: 6 },
  lengthChip: { width: 36, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  lengthChipText: { fontSize: 12, fontWeight: '600' as const },
  // Theme toggle
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeToggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleText: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});
