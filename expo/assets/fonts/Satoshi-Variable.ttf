import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Check,
  X,
  Sparkles,
  Crown,
  Shield,
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { getSubscriptionStatus, type SubscriptionStatus } from '@/lib/subscription-service';
import { COLORS, GRADIENTS, FONTS, TEXT_PRESETS } from '@/constants/theme';

type ResultKind = 'success' | 'cancelled' | 'pending' | 'error';

/**
 * Subscription result screen.
 *
 * Reached after the user is redirected back from Stripe Checkout via:
 *   - success_url:  <app>?subscription=success&session_id={CHECKOUT_SESSION_ID}
 *   - cancel_url:   <app>?subscription=cancelled
 *
 * The app's root index reads the `subscription` query param and redirects here.
 * This screen verifies the entitlement against the server (Stripe-via-Hono)
 * and surfaces a clear premium outcome to the user. It never mutates
 * subscription state itself — the Stripe webhook remains the single source of
 * truth. We only refresh the cached profile via useAuth().
 */
export default function SubscriptionResultScreen() {
  const params = useLocalSearchParams<{ subscription?: string; session_id?: string }>();
  const { refreshSubscriptionStatus, isPremium, isTrialActive, trialDaysLeft } = useAuth();

  const rawStatus = (params.subscription || '').toLowerCase();
  const initialKind: ResultKind =
    rawStatus === 'success' ? 'success' :
    rawStatus === 'cancelled' || rawStatus === 'cancel' ? 'cancelled' :
    rawStatus === 'pending' ? 'pending' : 'error';

  const [kind, setKind] = useState<ResultKind>(initialKind);
  const [serverStatus, setServerStatus] = useState<SubscriptionStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(28));
  const [badgeScale] = useState(new Animated.Value(0.4));

  const runEntrance = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        tension: 90,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, badgeScale]);

  useEffect(() => {
    runEntrance();

    let mounted = true;
    (async () => {
      setIsVerifying(true);
      setVerifyError(null);
      try {
        // Pull server-verified entitlement (queries Stripe, then Firestore fallback).
        const status = await getSubscriptionStatus();
        if (!mounted) return;
        setServerStatus(status);

        // Sync the cached auth profile so the rest of the app reflects truth.
        await refreshSubscriptionStatus();

        if (!mounted) return;
        // Refine the initial kind using server truth.
        if (initialKind === 'success') {
          if (status.isPremium) setKind('success');
          else if (status.isTrialActive) setKind('success');
          else setKind('pending');
        } else if (initialKind === 'cancelled') {
          setKind('cancelled');
        }
      } catch (e: any) {
        if (!mounted) return;
        setVerifyError(e?.message || 'We could not verify your subscription right now.');
        // If the redirect said success but verification failed, keep showing
        // success (Stripe will still fire the webhook and update Firestore).
        if (initialKind !== 'success') setKind('error');
      } finally {
        if (mounted) setIsVerifying(false);
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = useCallback(() => {
    router.replace('/(tabs)/sessions' as any);
  }, []);

  const handleManageBilling = useCallback(async () => {
    try {
      const { createBillingPortalSession } = await import('@/lib/subscription-service');
      const { url } = await createBillingPortalSession();
      if (url) await Linking.openURL(url);
    } catch (e: any) {
      setVerifyError(e?.message || 'Could not open the billing portal.');
    }
  }, []);

  const GlassCard = SharedGlassCard;

  // ── Render config per kind ──
  const config = (() => {
    switch (kind) {
      case 'success':
        return {
          icon: isTrialActive ? Sparkles : Crown,
          iconColor: isTrialActive ? COLORS.accent : COLORS.gold,
          iconBg: isTrialActive ? 'rgba(167,139,250,0.18)' : 'rgba(212,175,55,0.18)',
          iconBorder: isTrialActive ? 'rgba(167,139,250,0.4)' : 'rgba(212,175,55,0.4)',
          title: isTrialActive ? 'Trial Activated' : 'Premium Unlocked',
          subtitle: isTrialActive
            ? `Your 7-day free trial has started. ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining.`
            : 'Thank you for upgrading. Every premium frequency is now yours.',
          glowColors: isTrialActive
            ? (['rgba(108,99,255,0.22)', 'rgba(124,58,237,0.10)'] as const)
            : (['rgba(212,175,55,0.28)', 'rgba(245,208,96,0.10)'] as const),
        };
      case 'pending':
        return {
          icon: Loader2,
          iconColor: COLORS.accent,
          iconBg: 'rgba(167,139,250,0.16)',
          iconBorder: 'rgba(167,139,250,0.4)',
          title: 'Payment Processing',
          subtitle: 'Your payment is still being confirmed. We will activate your premium access the moment it clears — usually within a minute.',
          glowColors: ['rgba(108,99,255,0.18)', 'rgba(124,58,237,0.08)'] as const,
        };
      case 'cancelled':
        return {
          icon: X,
          iconColor: '#F87171',
          iconBg: 'rgba(248,113,113,0.15)',
          iconBorder: 'rgba(248,113,113,0.4)',
          title: 'Checkout Cancelled',
          subtitle: 'No worries — your free plan is still active. Upgrade anytime when you are ready to unlock the full experience.',
          glowColors: ['rgba(248,113,113,0.14)', 'rgba(248,113,113,0.06)'] as const,
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: '#F87171',
          iconBg: 'rgba(248,113,113,0.15)',
          iconBorder: 'rgba(248,113,113,0.4)',
          title: 'Verification Issue',
          subtitle: 'We could not confirm your subscription status right now. If you were charged, your premium access will activate automatically once our payment processor confirms.',
          glowColors: ['rgba(248,113,113,0.14)', 'rgba(248,113,113,0.06)'] as const,
        };
    }
  })();

  const Icon = config.icon;

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={styles.ambientOrb} pointerEvents="none" />
      <View style={styles.ambientOrb2} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Hero badge */}
            <View style={styles.heroWrap}>
              <Animated.View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor: config.iconBg,
                    borderColor: config.iconBorder,
                    transform: [{ scale: badgeScale }],
                  },
                ]}
              >
                {isVerifying && kind === 'pending' ? (
                  <ActivityIndicator color={config.iconColor} size="large" />
                ) : (
                  <Icon color={config.iconColor} size={36} />
                )}
              </Animated.View>
              <View style={[styles.heroGlow, { backgroundColor: config.iconBg }]} />
            </View>

            <Text style={styles.eyebrow}>
              {kind === 'success' ? 'Welcome' : kind === 'cancelled' ? 'Checkout' : 'Status'}
            </Text>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>

            {/* Status panel */}
            <View style={styles.statusCardWrap}>
              <LinearGradient colors={config.glowColors} style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                    {isVerifying ? (
                      <ActivityIndicator color={COLORS.textSecondary} size="small" />
                    ) : kind === 'success' && isPremium ? (
                      <Crown color={COLORS.gold} size={16} />
                    ) : kind === 'success' && isTrialActive ? (
                      <Sparkles color={COLORS.accent} size={16} />
                    ) : (
                      <Shield color={COLORS.textMuted} size={16} />
                    )}
                  </View>
                  <View style={styles.statusTextCol}>
                    <Text style={styles.statusLabel}>Entitlement</Text>
                    <Text style={styles.statusValue}>
                      {isVerifying
                        ? 'Verifying with Stripe…'
                        : serverStatus
                          ? serverStatus.isPremium
                            ? 'Premium Active'
                            : serverStatus.isTrialActive
                              ? `Trial · ${serverStatus.trialDaysLeft}d left`
                              : 'Free Plan'
                          : isPremium
                            ? 'Premium Active'
                            : isTrialActive
                              ? `Trial · ${trialDaysLeft}d left`
                              : 'Free Plan'}
                    </Text>
                  </View>
                </View>

                {serverStatus?.subscriptionEndsAt && (
                  <View style={styles.statusRow}>
                    <View style={[styles.statusIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                      <Calendar color={COLORS.textSecondary} size={16} />
                    </View>
                    <View style={styles.statusTextCol}>
                      <Text style={styles.statusLabel}>Renews On</Text>
                      <Text style={styles.statusValue}>
                        {new Date(serverStatus.subscriptionEndsAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text style={[styles.renewTag, serverStatus.cancelAtPeriodEnd && styles.renewTagCancelled]}>
                      {serverStatus.cancelAtPeriodEnd ? 'Cancels' : 'Auto-renews'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Verification banner */}
            {isVerifying && (
              <GlassCard style={styles.verifyCard}>
                <ActivityIndicator color={COLORS.accent} size="small" />
                <Text style={styles.verifyText}>Verifying your payment with Stripe…</Text>
              </GlassCard>
            )}

            {verifyError && !isVerifying && (
              <GlassCard style={styles.errorCard}>
                <AlertCircle color="#F87171" size={16} />
                <Text style={styles.errorText}>{verifyError}</Text>
              </GlassCard>
            )}

            {/* Premium benefits (success only) */}
            {kind === 'success' && !isVerifying && (
              <>
                <Text style={styles.sectionTitle}>What you unlocked</Text>
                <GlassCard style={styles.benefitsCard}>
                  {[
                    { icon: Crown, text: '100+ premium frequencies' },
                    { icon: Sparkles, text: 'Unlimited session duration' },
                    { icon: Shield, text: 'Offline downloads' },
                    { icon: CreditCard, text: 'Priority support' },
                  ].map((row, i) => (
                    <View key={row.text}>
                      <View style={styles.benefitRow}>
                        <View style={[styles.benefitIcon, { backgroundColor: 'rgba(212,175,55,0.15)' }]}>
                          <row.icon color={COLORS.gold} size={16} />
                        </View>
                        <Text style={styles.benefitText}>{row.text}</Text>
                        <Check color="#34D399" size={16} />
                      </View>
                      {i < 3 && <View style={styles.benefitSep} />}
                    </View>
                  ))}
                </GlassCard>
              </>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleDone}
                activeOpacity={0.9}
                testID="subscription-result-done"
              >
                <LinearGradient
                  colors={kind === 'success' ? GRADIENTS.gold : (['rgba(108,99,255,0.9)', 'rgba(124,58,237,0.85)'] as const)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGrad}
                >
                  <Text style={kind === 'success' ? styles.primaryBtnTextDark : styles.primaryBtnTextLight}>
                    {kind === 'success' ? 'Start Exploring' : 'Back to App'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {kind === 'success' && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleManageBilling}
                  activeOpacity={0.85}
                >
                  <CreditCard color={COLORS.textSecondary} size={16} />
                  <Text style={styles.secondaryBtnText}>Manage billing</Text>
                </TouchableOpacity>
              )}
              {kind === 'cancelled' && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.replace('/(tabs)/sessions' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryBtnText}>Continue with Free</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.disclaimer}>
              Subscriptions auto-renew unless cancelled at least 24 hours before the period ends. Manage your subscription anytime in Settings.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },
  ambientOrb: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(212,175,55,0.07)', top: -90, right: -110,
  },
  ambientOrb2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(108,99,255,0.08)', bottom: 140, left: -90,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 20 },
  heroWrap: { alignItems: 'center', marginTop: 12, marginBottom: 18, position: 'relative' },
  heroGlow: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    top: -18, opacity: 0.35, transform: [{ scale: 1.1 }],
  },
  heroBadge: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  eyebrow: {
    ...TEXT_PRESETS.labelSmall,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  title: {
    ...TEXT_PRESETS.heroMedium,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
  subtitle: {
    ...TEXT_PRESETS.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  statusCardWrap: { marginTop: 26, borderRadius: 20, overflow: 'hidden' },
  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 18,
    gap: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  statusTextCol: { flex: 1 },
  statusLabel: { ...TEXT_PRESETS.labelSmall, color: COLORS.textMuted, marginBottom: 3 },
  statusValue: { ...TEXT_PRESETS.bodyMedium, color: COLORS.textPrimary, fontWeight: '600' as const },
  renewTag: {
    fontSize: 11, fontWeight: '700' as const, color: '#34D399',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(52,211,153,0.14)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
    letterSpacing: 0.3,
  },
  renewTagCancelled: {
    color: '#FBBF24',
    backgroundColor: 'rgba(251,191,36,0.14)',
    borderColor: 'rgba(251,191,36,0.3)',
  },
  verifyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, marginTop: 16,
  },
  verifyText: { ...TEXT_PRESETS.bodySmall, color: COLORS.textSecondary },
  errorCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 14, marginTop: 16,
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderColor: 'rgba(248,113,113,0.28)',
  },
  errorText: { ...TEXT_PRESETS.bodySmall, color: '#F87171', flex: 1, lineHeight: 18 },
  sectionTitle: {
    ...TEXT_PRESETS.labelMedium,
    color: COLORS.textMuted,
    marginTop: 26,
    marginBottom: 10,
    marginLeft: 4,
  },
  benefitsCard: { borderRadius: 18, padding: 4 },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  benefitIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { ...TEXT_PRESETS.bodyMedium, color: COLORS.textPrimary, flex: 1 },
  benefitSep: { height: 1, backgroundColor: COLORS.divider, marginHorizontal: 14 },
  actionsRow: { marginTop: 28, gap: 12 },
  primaryBtn: { borderRadius: 16, overflow: 'hidden' },
  primaryBtnGrad: {
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnTextDark: {
    fontFamily: FONTS.body, fontSize: 15, fontWeight: '700' as const,
    color: '#1a1200', letterSpacing: 0.3,
  },
  primaryBtnTextLight: {
    fontFamily: FONTS.body, fontSize: 15, fontWeight: '700' as const,
    color: '#fff', letterSpacing: 0.3,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8, borderRadius: 14,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
  },
  secondaryBtnText: {
    fontFamily: FONTS.body, fontSize: 14, fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  disclaimer: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 16, marginTop: 20, paddingHorizontal: 12,
  },
});
