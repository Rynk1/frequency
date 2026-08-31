import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import { Crown, Clock, Zap, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumUsage } from '@/hooks/usePremiumUsage';
import { PremiumModal } from './PremiumModal';
import { COLORS, FONTS, TEXT_PRESETS } from '@/constants/theme';

export const PremiumStatusBar: React.FC = () => {
  const { isPremium, isTrialActive, trialDaysLeft } = useAuth();
  const { getUsageStats } = usePremiumUsage();
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);

  const stats = getUsageStats();

  const GlassWrap = SharedGlassCard;

  if (isPremium) {
    return (
      <>
        <View style={styles.premiumContainer}>
          <LinearGradient
            colors={['rgba(212,175,55,0.22)', 'rgba(245,208,96,0.08)'] as const}
            style={styles.premiumGradient}
          >
            <View style={styles.premiumLeft}>
              <View style={styles.premiumBadge}>
                <Crown color={COLORS.gold} size={14} />
              </View>
              <Text style={styles.premiumText}>Premium Active</Text>
            </View>
            <View style={styles.premiumRight}>
              <Text style={styles.premiumStat}>{stats.streakDays} day streak</Text>
            </View>
          </LinearGradient>
        </View>

        <PremiumModal
          visible={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />
      </>
    );
  }

  if (isTrialActive) {
    return (
      <>
        <TouchableOpacity
          style={styles.trialContainer}
          onPress={() => setShowPremiumModal(true)}
          testID="trial-status-bar"
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['rgba(108,99,255,0.18)', 'rgba(124,58,237,0.08)'] as const}
            style={styles.trialGradient}
          >
            <View style={styles.trialLeft}>
              <View style={styles.trialBadge}>
                <Zap color={COLORS.accent} size={14} />
              </View>
              <Text style={styles.trialText}>Trial · {trialDaysLeft}d left</Text>
            </View>
            <View style={styles.upgradeChip}>
              <Text style={styles.upgradeChipText}>Upgrade</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <PremiumModal
          visible={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.freeContainer}
        onPress={() => setShowPremiumModal(true)}
        testID="free-status-bar"
        activeOpacity={0.85}
      >
        <GlassWrap style={styles.freeGlass}>
          <View style={styles.freeContent}>
            <View style={styles.freeStats}>
              <View style={styles.statItem}>
                <Clock color={COLORS.textMuted} size={13} />
                <Text style={styles.statText}>
                  {stats.remainingFreeSessions === Infinity ? '∞' : stats.remainingFreeSessions}/3 left
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <TrendingUp color={COLORS.textMuted} size={13} />
                <Text style={styles.statText}>
                  {Math.floor(stats.totalListeningTime / 60)}m total
                </Text>
              </View>
            </View>

            <View style={styles.upgradeButton}>
              <LinearGradient
                colors={['rgba(212,175,55,0.85)', 'rgba(245,208,96,0.75)'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                <Crown color="#1a1200" size={11} />
                <Text style={styles.upgradeButtonText}>Try Premium</Text>
              </LinearGradient>
            </View>
          </View>
        </GlassWrap>
      </TouchableOpacity>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // Premium
  premiumContainer: {
    marginHorizontal: 16, marginVertical: 8,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  premiumGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11,
  },
  premiumLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  premiumBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(212,175,55,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  premiumText: { ...TEXT_PRESETS.labelMedium, color: COLORS.gold, letterSpacing: 0.3 },
  premiumRight: {},
  premiumStat: { fontSize: 12, fontWeight: '500' as const, color: 'rgba(245,208,96,0.7)' },
  // Trial
  trialContainer: {
    marginHorizontal: 16, marginVertical: 8,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)',
  },
  trialGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11,
  },
  trialLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  trialBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(167,139,250,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  trialText: { ...TEXT_PRESETS.labelMedium, color: COLORS.accent, letterSpacing: 0.3 },
  upgradeChip: {
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  upgradeChipText: { fontSize: 11, fontWeight: '700' as const, color: COLORS.accent, letterSpacing: 0.3 },
  // Free
  freeContainer: { marginHorizontal: 16, marginVertical: 8, borderRadius: 14, overflow: 'hidden' },
  freeGlass: { borderRadius: 14, padding: 0 },
  freeContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  freeStats: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statDivider: { width: 1, height: 14, backgroundColor: COLORS.dividerBright },
  statText: { fontSize: 12, fontWeight: '500' as const, color: COLORS.textSecondary, letterSpacing: 0.2 },
  upgradeButton: { borderRadius: 10, overflow: 'hidden' },
  upgradeGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  upgradeButtonText: { fontFamily: FONTS.body, fontSize: 11, fontWeight: '700' as const, color: '#1a1200', letterSpacing: 0.3 },
});
