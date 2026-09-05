import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Lock, Sparkles, X, Check } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { PremiumModal } from './PremiumModal';
import { COLORS, GRADIENTS, FONTS, TEXT_PRESETS } from '@/constants/theme';

interface PremiumGateProps {
  visible: boolean;
  onClose: () => void;
  feature: string;
  description: string;
  icon?: React.ComponentType<any>;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  visible,
  onClose,
  feature,
  description,
  icon: Icon = Lock,
}) => {
  const { isTrialActive, trialDaysLeft } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);

  const handleUpgradePress = () => setShowPremiumModal(true);
  const handlePremiumModalClose = () => {
    setShowPremiumModal(false);
    onClose();
  };

  const benefits: string[] = [
    'Unlimited access to all frequencies',
    'Advanced binaural beats',
    'Custom session lengths up to 4 hours',
    'Detailed progress tracking',
    'Offline downloads',
  ];

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <LinearGradient
              colors={['rgba(15,22,40,0.96)', 'rgba(10,14,26,0.96)'] as const}
              style={styles.gradient}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                testID="close-premium-gate"
                accessibilityRole="button"
                accessibilityLabel="Close premium gate"
                accessibilityHint="Double tap to close"
              >
                <X color={COLORS.textSecondary} size={20} />
              </TouchableOpacity>

              <View style={styles.content}>
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={['rgba(212,175,55,0.22)', 'rgba(245,208,96,0.06)'] as const}
                    style={styles.iconGlow}
                  >
                    <Icon color={COLORS.gold} size={32} />
                  </LinearGradient>
                  <View style={styles.lockOverlay}>
                    <Lock color={COLORS.gold} size={14} />
                  </View>
                </View>

                <Text style={styles.eyebrow}>Premium Feature</Text>
                <Text style={styles.featureName}>{feature}</Text>
                <Text style={styles.description}>{description}</Text>

                {isTrialActive ? (
                  <View style={styles.trialInfo}>
                    <Sparkles color={COLORS.accent} size={16} />
                    <Text style={styles.trialText}>
                      Trial active · {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left
                    </Text>
                  </View>
                ) : (
                  <View style={styles.benefitsContainer}>
                    {benefits.map((b, i) => (
                      <View key={i} style={styles.benefitRow}>
                        <View style={styles.benefitDot}>
                          <Check color={COLORS.gold} size={10} />
                        </View>
                        <Text style={styles.benefitItem}>{b}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgradePress}
                  testID="upgrade-from-gate"
                  accessibilityRole="button"
                  accessibilityLabel={`${feature}, Premium Feature`}
                  accessibilityHint="Double tap to start trial or view subscription plans"
                >
                  <LinearGradient
                    colors={GRADIENTS.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeGradient}
                  >
                    <Crown color="#1a1200" size={18} />
                    <Text style={styles.upgradeButtonText}>
                      {isTrialActive ? 'Upgrade Now' : 'Start Free Trial'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {!isTrialActive && (
                  <Text style={styles.trialNote}>
                    7-day free trial · Cancel anytime
                  </Text>
                )}
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <PremiumModal
        visible={showPremiumModal}
        onClose={handlePremiumModalClose}
        onStartTrial={handlePremiumModalClose}
        onUpgrade={handlePremiumModalClose}
        trigger="premium_content"
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  gradient: { padding: 24, borderRadius: 24 },
  closeButton: {
    alignSelf: 'flex-end', width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  content: { alignItems: 'center' },
  iconContainer: { position: 'relative', marginBottom: 16 },
  iconGlow: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  lockOverlay: {
    position: 'absolute', bottom: -6, right: -6,
    backgroundColor: COLORS.bg, borderRadius: 12,
    padding: 4, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  eyebrow: { ...TEXT_PRESETS.labelSmall, color: COLORS.textMuted, marginBottom: 6 },
  featureName: {
    ...TEXT_PRESETS.headingMedium, color: COLORS.gold,
    textAlign: 'center', marginBottom: 8,
  },
  description: {
    ...TEXT_PRESETS.bodyMedium, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 18,
  },
  trialInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 18,
  },
  trialText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' as const },
  benefitsContainer: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  benefitDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.goldGlow, alignItems: 'center', justifyContent: 'center',
  },
  benefitItem: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 17 },
  upgradeButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 12, width: '100%' },
  upgradeGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 28, gap: 8,
  },
  upgradeButtonText: { fontFamily: FONTS.body, fontSize: 15, fontWeight: '700' as const, color: '#1a1200' },
  trialNote: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
});
