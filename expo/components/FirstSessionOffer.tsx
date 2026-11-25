import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { PremiumModal } from './PremiumModal';
import { track } from '@/lib/telemetry';

const SEEN_KEY = 'hf:first-session-offer';

export const FirstSessionOffer: React.FC = () => {
  const { user, userProfile, isPremium, isTrialActive } = useAuth();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const shownRef = useRef(false);

  const key = user?.uid ? `${SEEN_KEY}:${user.uid}` : null;

  useEffect(() => {
    if (!key || isPremium || isTrialActive || shownRef.current) return;
    if ((userProfile?.usageStats.sessionsCompleted || 0) !== 1) return;
    let mounted = true;
    AsyncStorage.getItem(key)
      .then((seen) => {
        if (!mounted || seen || shownRef.current) return;
        shownRef.current = true;
        setVisible(true);
        track('first_session_offer_viewed', {});
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [key, isPremium, isTrialActive, userProfile?.usageStats.sessionsCompleted]);

  const dismiss = async (choice: 'free' | 'trial') => {
    if (key) await AsyncStorage.setItem(key, choice).catch(() => {});
    setVisible(false);
    if (choice === 'trial') {
      track('first_session_offer_trial', {});
      setShowPaywall(true);
    } else {
      track('first_session_offer_dismissed', { choice: 'continue_free' });
    }
  };

  if (!key) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => dismiss('free')}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.glassBorder }]}>
            <Text style={[styles.eyebrow, { color: colors.gold }]}>Your first session</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>How did that feel?</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Full-length sessions and the full library are here when you want them.
              You can keep listening free for now.
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.freeButton, { borderColor: colors.glassBorder }]}
                onPress={() => dismiss('free')}
                activeOpacity={0.85}
              >
                <Text style={[styles.freeButtonText, { color: colors.textPrimary }]}>Continue free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.trialButton, { backgroundColor: colors.gold }]}
                onPress={() => dismiss('trial')}
                activeOpacity={0.85}
              >
                <Text style={styles.trialButtonText}>Start 7-day trial</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PremiumModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onStartTrial={() => setShowPaywall(false)}
        onUpgrade={() => setShowPaywall(false)}
        trigger="first_session"
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,7,15,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  freeButton: {
    borderWidth: 1,
  },
  freeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trialButton: {},
  trialButtonText: {
    color: '#1a1200',
    fontSize: 14,
    fontWeight: '700',
  },
});
