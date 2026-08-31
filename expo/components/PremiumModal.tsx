import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import * as WebBrowser from 'expo-web-browser';
import {
  Crown,
  Check,
  Star,
  Zap,
  Heart,
  Music,
  X,
  Sparkles,
  Timer,
  TrendingUp,
  Shield,
  CreditCard,
  ChevronRight,
  Loader2,
  Headphones,
  Download,
  Infinity as InfinityIcon,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import {
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  resumeSubscription,
  type Plan,
} from '@/lib/subscription-service';
import { COLORS, GRADIENTS, FONTS, TEXT_PRESETS } from '@/constants/theme';

type PremiumModalProps = {
  visible: boolean;
  onClose: () => void;
  onStartTrial?: () => void;
  onUpgrade?: (type: 'monthly' | 'yearly') => void;
};

type ManagementAction = 'none' | 'cancel' | 'resume';

export const PremiumModal: React.FC<PremiumModalProps> = ({
  visible,
  onClose,
  onStartTrial,
  onUpgrade,
}) => {
  const { userProfile, isTrialActive, trialDaysLeft, isPremium, refreshSubscriptionStatus } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [hasAcceptedAutoRenew, setHasAcceptedAutoRenew] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingLabel, setProcessingLabel] = useState<string>('');
  const [showManageSheet, setShowManageSheet] = useState<boolean>(false);
  const [managementAction, setManagementAction] = useState<ManagementAction>('none');
  const [error, setError] = useState<string | null>(null);

  // Entrance animation
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(40));

  React.useEffect(() => {
    if (visible) {
      setError(null);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      setShowManageSheet(false);
      setManagementAction('none');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleStartTrial = useCallback(async () => {
    if (!hasAcceptedAutoRenew) {
      setError('Please accept the auto-renew terms to start your free trial.');
      return;
    }
    await initiateCheckout(selectedPlan, true);
  }, [hasAcceptedAutoRenew, selectedPlan]);

  const handleUpgrade = useCallback(async () => {
    await initiateCheckout(selectedPlan, false);
  }, [selectedPlan]);

  const initiateCheckout = useCallback(async (plan: Plan, trialEnabled: boolean) => {
    setError(null);
    setIsProcessing(true);
    setProcessingLabel(trialEnabled ? 'Preparing your free trial…' : 'Redirecting to secure checkout…');
    try {
      const { url } = await createCheckoutSession(plan, { trialEnabled });
      if (!url) throw new Error('No checkout URL returned.');
      // Open Stripe Checkout in browser
      const result = await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: COLORS.bg,
      });
      // Refresh subscription status when the user returns from checkout
      if (refreshSubscriptionStatus) {
        await refreshSubscriptionStatus();
      }
      onStartTrial?.();
      onUpgrade?.(plan);
      onClose();
    } catch (e: any) {
      const message = e?.message || 'Checkout failed. Please try again.';
      setError(message);
      // Don't close on error — let the user retry
    } finally {
      setIsProcessing(false);
      setProcessingLabel('');
    }
  }, [refreshSubscriptionStatus, onStartTrial, onUpgrade, onClose]);

  const handleManageSubscription = useCallback(async () => {
    setError(null);
    setIsProcessing(true);
    setProcessingLabel('Opening account portal…');
    try {
      const { url } = await createBillingPortalSession();
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: COLORS.bg,
      });
      if (refreshSubscriptionStatus) await refreshSubscriptionStatus();
      setShowManageSheet(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to open account portal.');
    } finally {
      setIsProcessing(false);
      setProcessingLabel('');
    }
  }, [refreshSubscriptionStatus]);

  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  const handleCancelSubscription = useCallback(() => {
    // Open the premium-styled confirmation sheet first — never cancel on a single tap.
    setError(null);
    setShowCancelConfirm(true);
  }, []);

  const confirmCancelSubscription = useCallback(async () => {
    setError(null);
    setManagementAction('cancel');
    setIsProcessing(true);
    setProcessingLabel('Cancelling renewal…');
    try {
      await cancelSubscription();
      if (refreshSubscriptionStatus) await refreshSubscriptionStatus();
      setShowCancelConfirm(false);
      Alert.alert(
        'Subscription Cancelled',
        'Your subscription will remain active until the end of your billing period, then will not renew.',
        [{ text: 'OK', onPress: () => setShowManageSheet(false) }]
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel subscription.');
    } finally {
      setIsProcessing(false);
      setProcessingLabel('');
      setManagementAction('none');
    }
  }, [refreshSubscriptionStatus]);

  const handleResumeSubscription = useCallback(async () => {
    setError(null);
    setManagementAction('resume');
    setIsProcessing(true);
    setProcessingLabel('Resuming subscription…');
    try {
      await resumeSubscription();
      if (refreshSubscriptionStatus) await refreshSubscriptionStatus();
      setShowManageSheet(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to resume subscription.');
    } finally {
      setIsProcessing(false);
      setProcessingLabel('');
      setManagementAction('none');
    }
  }, [refreshSubscriptionStatus]);

  const premiumFeatures: { id: string; icon: any; text: string; highlight?: boolean }[] = [
    { id: 'premium-frequencies', icon: Music, text: 'Access to 100+ Premium Frequencies', highlight: true },
    { id: 'unlimited-duration', icon: InfinityIcon, text: 'Unlimited Session Duration' },
    { id: 'binaural-beats', icon: Heart, text: 'Advanced Binaural Beats' },
    { id: 'custom-mixing', icon: Sparkles, text: 'Custom Frequency Mixing' },
    { id: 'analytics', icon: TrendingUp, text: 'Detailed Progress Analytics' },
    { id: 'offline-downloads', icon: Download, text: 'Offline Downloads' },
    { id: 'priority-support', icon: Headphones, text: 'Priority Customer Support' },
  ];

  const monthlyPrice = 9.99;
  const yearlyPrice = 59.99;
  const yearlyMonthlyPrice = yearlyPrice / 12;
  const savings = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);

  const GlassCard = SharedGlassCard;

  // ── Active subscriber view ──
  if (isPremium || isTrialActive) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.container}>
          <LinearGradient colors={GRADIENTS.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <View style={styles.ambientOrb} pointerEvents="none" />
          <View style={styles.ambientOrb2} pointerEvents="none" />

          <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
              <Text style={styles.eyebrow}>Membership</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="close-premium-modal">
                <X color={COLORS.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                {/* Hero status card */}
                <View style={styles.statusHero}>
                  <LinearGradient
                    colors={isTrialActive ? ['rgba(108,99,255,0.25)', 'rgba(124,58,237,0.12)'] : ['rgba(212,175,55,0.3)', 'rgba(245,208,96,0.12)'] as const}
                    style={styles.statusHeroGrad}
                  >
                    <View style={styles.statusHeroTop}>
                      <View style={[styles.statusHeroBadge, {
                        backgroundColor: isTrialActive ? 'rgba(167,139,250,0.18)' : 'rgba(212,175,55,0.18)',
                        borderColor: isTrialActive ? 'rgba(167,139,250,0.4)' : 'rgba(212,175,55,0.4)',
                      }]}>
                        {isTrialActive ? <Sparkles color={COLORS.accent} size={20} /> : <Crown color={COLORS.gold} size={20} />}
                      </View>
                      <View style={styles.statusHeroText}>
                        <Text style={styles.statusHeroLabel}>{isTrialActive ? 'Trial Active' : 'Premium Member'}</Text>
                        <Text style={styles.statusHeroSub}>
                          {isTrialActive
                            ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining in your trial`
                            : 'Thank you for supporting HarmonyFrequency'}
                        </Text>
                      </View>
                    </View>

                    {userProfile?.subscriptionType && (
                      <View style={styles.statusMetaRow}>
                        <View style={styles.statusMetaItem}>
                          <Text style={styles.statusMetaLabel}>Plan</Text>
                          <Text style={styles.statusMetaValue}>
                            {userProfile.subscriptionType === 'yearly' ? 'Yearly' : 'Monthly'}
                          </Text>
                        </View>
                        <View style={styles.statusMetaDivider} />
                        <View style={styles.statusMetaItem}>
                          <Text style={styles.statusMetaLabel}>Renewal</Text>
                          <Text style={styles.statusMetaValue}>
                            {userProfile.cancelAtPeriodEnd ? 'Cancels at period end' : 'Auto-renews'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </View>

                {/* Benefits list */}
                <Text style={styles.sectionTitle}>Your Premium Benefits</Text>
                <GlassCard style={styles.benefitsCard}>
                  {premiumFeatures.map((feature, i) => (
                    <View key={feature.id}>
                      <View style={styles.benefitRow}>
                        <View style={[styles.benefitIcon, {
                          backgroundColor: feature.highlight ? COLORS.goldGlow : COLORS.accentSoft,
                        }]}>
                          <feature.icon color={feature.highlight ? COLORS.gold : COLORS.accent} size={18} />
                        </View>
                        <Text style={styles.benefitText}>{feature.text}</Text>
                        <Check color="#34D399" size={16} />
                      </View>
                      {i < premiumFeatures.length - 1 && <View style={styles.benefitSep} />}
                    </View>
                  ))}
                </GlassCard>

                {/* Management actions */}
                <Text style={styles.sectionTitle}>Manage Subscription</Text>
                <GlassCard style={styles.managementCard}>
                  <TouchableOpacity
                    style={styles.mgmtRow}
                    onPress={handleManageSubscription}
                    disabled={isProcessing}
                  >
                    <View style={[styles.mgmtIcon, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
                      <CreditCard color="#60A5FA" size={18} />
                    </View>
                    <View style={styles.mgmtText}>
                      <Text style={styles.mgmtTitle}>Billing Portal</Text>
                      <Text style={styles.mgmtSub}>Update payment method, invoices</Text>
                    </View>
                    <ChevronRight color={COLORS.textMuted} size={16} />
                  </TouchableOpacity>

                  <View style={styles.mgmtSep} />

                  {userProfile?.cancelAtPeriodEnd ? (
                    <TouchableOpacity
                      style={styles.mgmtRow}
                      onPress={handleResumeSubscription}
                      disabled={isProcessing || managementAction === 'resume'}
                    >
                      <View style={[styles.mgmtIcon, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
                        {managementAction === 'resume' && isProcessing ? (
                          <ActivityIndicator color="#34D399" size="small" />
                        ) : (
                          <Zap color="#34D399" size={18} />
                        )}
                      </View>
                      <View style={styles.mgmtText}>
                        <Text style={styles.mgmtTitle}>Resume Subscription</Text>
                        <Text style={styles.mgmtSub}>Continue auto-renewal</Text>
                      </View>
                      <ChevronRight color={COLORS.textMuted} size={16} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.mgmtRow}
                      onPress={handleCancelSubscription}
                      disabled={isProcessing || managementAction === 'cancel'}
                    >
                      <View style={[styles.mgmtIcon, { backgroundColor: 'rgba(248,113,113,0.15)' }]}>
                        {managementAction === 'cancel' && isProcessing ? (
                          <ActivityIndicator color="#F87171" size="small" />
                        ) : (
                          <X color="#F87171" size={18} />
                        )}
                      </View>
                      <View style={styles.mgmtText}>
                        <Text style={[styles.mgmtTitle, { color: '#F87171' }]}>Cancel Renewal</Text>
                        <Text style={styles.mgmtSub}>Keep access until period ends</Text>
                      </View>
                      <ChevronRight color={COLORS.textMuted} size={16} />
                    </TouchableOpacity>
                  )}
                </GlassCard>

                {error && (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Text style={styles.secureNote}>
                  <Shield color={COLORS.textMuted} size={12} />  Subscriptions are securely processed by Stripe. Cancel anytime.
                </Text>
              </Animated.View>
            </ScrollView>
          </SafeAreaView>
        </View>

        {/* Cancel confirmation sheet — premium styled, two-step cancellation */}
        <Modal
          visible={showCancelConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => !isProcessing && setShowCancelConfirm(false)}
        >
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmSheet}>
              <LinearGradient
                colors={['rgba(15,22,40,0.98)', 'rgba(10,14,26,0.98)'] as const}
                style={styles.confirmGradient}
              >
                <View style={styles.confirmIconWrap}>
                  <View style={styles.confirmIconGlow} />
                  <View style={styles.confirmIcon}>
                    <X color="#F87171" size={26} />
                  </View>
                </View>
                <Text style={styles.confirmEyebrow}>Cancel Subscription</Text>
                <Text style={styles.confirmTitle}>Are you sure?</Text>
                <Text style={styles.confirmBody}>
                  You will keep full premium access until the end of your current billing period. After that, your subscription will not renew and you will revert to the free plan.
                </Text>

                <View style={styles.confirmBenefitsRow}>
                  <View style={styles.confirmBenefitItem}>
                    <Check color="#34D399" size={12} />
                    <Text style={styles.confirmBenefitText}>Access until period ends</Text>
                  </View>
                  <View style={styles.confirmBenefitItem}>
                    <Check color="#34D399" size={12} />
                    <Text style={styles.confirmBenefitText}>No immediate charges</Text>
                  </View>
                  <View style={styles.confirmBenefitItem}>
                    <Zap color={COLORS.accent} size={12} />
                    <Text style={styles.confirmBenefitText}>Resume anytime</Text>
                  </View>
                </View>

                {error && (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={confirmCancelSubscription}
                  disabled={isProcessing || managementAction === 'cancel'}
                  activeOpacity={0.9}
                  testID="confirm-cancel-subscription"
                >
                  {managementAction === 'cancel' && isProcessing ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.confirmCancelBtnText}>{processingLabel || 'Cancelling…'}</Text>
                    </>
                  ) : (
                    <>
                      <X color="#fff" size={16} />
                      <Text style={styles.confirmCancelBtnText}>Yes, cancel renewal</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmKeepBtn}
                  onPress={() => setShowCancelConfirm(false)}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmKeepBtnText}>Keep my subscription</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </Modal>
    );
  }

  // ── Upgrade view (free users) ──
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={GRADIENTS.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={styles.ambientOrb} pointerEvents="none" />
        <View style={styles.ambientOrb2} pointerEvents="none" />
        <View style={styles.ambientOrb3} pointerEvents="none" />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <Text style={styles.eyebrow}>Upgrade</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="close-premium-modal">
              <X color={COLORS.textSecondary} size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* Hero */}
              <View style={styles.heroSection}>
                <View style={styles.crownContainer}>
                  <LinearGradient
                    colors={['rgba(212,175,55,0.25)', 'rgba(245,208,96,0.08)'] as const}
                    style={styles.crownGlow}
                  >
                    <Crown color={COLORS.gold} size={36} />
                  </LinearGradient>
                  <Sparkles color={COLORS.goldLight} size={14} style={styles.sparkle1} />
                  <Sparkles color={COLORS.goldLight} size={10} style={styles.sparkle2} />
                </View>
                <Text style={styles.heroTitle}>Unlock Premium</Text>
                <Text style={styles.heroSubtitle}>
                  Transform your wellness journey with unlimited access
                </Text>
              </View>

              {/* Trial card */}
              {!isTrialActive && userProfile?.subscriptionStatus === 'free' && (
                <View style={styles.trialCardWrap}>
                  <LinearGradient
                    colors={['rgba(108,99,255,0.18)', 'rgba(124,58,237,0.08)'] as const}
                    style={styles.trialCard}
                  >
                    <View style={styles.trialHeader}>
                      <Sparkles color={COLORS.accent} size={18} />
                      <Text style={styles.trialTitle}>7-Day Free Trial</Text>
                    </View>
                    <Text style={styles.trialDesc}>
                      Experience every premium feature free for 7 days. Cancel before it ends and you won't be charged.
                    </Text>

                    <TouchableOpacity
                      style={styles.acceptRow}
                      onPress={() => setHasAcceptedAutoRenew((p) => !p)}
                      testID="trial-auto-renew-accept"
                    >
                      <View style={[styles.checkbox, hasAcceptedAutoRenew && styles.checkboxChecked]}>
                        {hasAcceptedAutoRenew && <Check color={COLORS.bg} size={12} />}
                      </View>
                      <Text style={styles.acceptText}>
                        I agree to start a subscription with auto-renewal. I can cancel anytime at least 24 hours before the trial ends to avoid charges.
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.trialButton, !hasAcceptedAutoRenew && styles.btnDisabled]}
                      onPress={handleStartTrial}
                      disabled={!hasAcceptedAutoRenew || isProcessing}
                      testID="start-trial-button"
                    >
                      {isProcessing && processingLabel.includes('trial') ? (
                        <ActivityIndicator color={COLORS.bg} size="small" />
                      ) : (
                        <Text style={styles.trialButtonText}>Start Free Trial with {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}</Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              )}

              {/* Features */}
              <Text style={styles.sectionTitle}>Premium Features</Text>
              <View style={styles.featuresCard}>
                {premiumFeatures.map((feature, i) => (
                  <View key={feature.id}>
                    <View style={styles.featureRow}>
                      <View style={[styles.featureIcon, {
                        backgroundColor: feature.highlight ? COLORS.goldGlow : COLORS.accentSoft,
                      }]}>
                        <feature.icon color={feature.highlight ? COLORS.gold : COLORS.accent} size={18} />
                      </View>
                      <Text style={[styles.featureText, feature.highlight && styles.featureTextHighlight]}>
                        {feature.text}
                      </Text>
                      {feature.highlight && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                    </View>
                    {i < premiumFeatures.length - 1 && <View style={styles.featureSep} />}
                  </View>
                ))}
              </View>

              {/* Pricing */}
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>

              {/* Yearly */}
              <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
                onPress={() => setSelectedPlan('yearly')}
                testID="yearly-plan"
              >
                <LinearGradient
                  colors={selectedPlan === 'yearly' ? ['rgba(212,175,55,0.18)', 'rgba(245,208,96,0.06)'] as const : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)'] as const}
                  style={styles.planCardGrad}
                >
                  <View style={styles.planHeaderRow}>
                    <View style={styles.planInfoCol}>
                      <Text style={styles.planName}>Yearly</Text>
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>Save {savings}%</Text>
                      </View>
                    </View>
                    <View style={styles.planPriceCol}>
                      <Text style={styles.planPrice}>${yearlyMonthlyPrice.toFixed(2)}</Text>
                      <Text style={styles.planPeriod}>/month</Text>
                    </View>
                  </View>
                  <Text style={styles.planBilling}>Billed annually at ${yearlyPrice.toFixed(2)}</Text>
                  {selectedPlan === 'yearly' && (
                    <View style={styles.planCheck}>
                      <Check color={COLORS.bg} size={14} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Monthly */}
              <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
                onPress={() => setSelectedPlan('monthly')}
                testID="monthly-plan"
              >
                <LinearGradient
                  colors={selectedPlan === 'monthly' ? ['rgba(212,175,55,0.18)', 'rgba(245,208,96,0.06)'] as const : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)'] as const}
                  style={styles.planCardGrad}
                >
                  <View style={styles.planHeaderRow}>
                    <View style={styles.planInfoCol}>
                      <Text style={styles.planName}>Monthly</Text>
                    </View>
                    <View style={styles.planPriceCol}>
                      <Text style={styles.planPrice}>${monthlyPrice.toFixed(2)}</Text>
                      <Text style={styles.planPeriod}>/month</Text>
                    </View>
                  </View>
                  <Text style={styles.planBilling}>Billed monthly · Cancel anytime</Text>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.planCheck}>
                      <Check color={COLORS.bg} size={14} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {error && (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Upgrade CTA */}
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                disabled={isProcessing}
                testID="upgrade-button"
              >
                <LinearGradient
                  colors={GRADIENTS.gold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeGradient}
                >
                  {isProcessing ? (
                    <>
                      <ActivityIndicator color="#1a1200" size="small" />
                      <Text style={styles.upgradeBtnTextDark}>{processingLabel || 'Processing…'}</Text>
                    </>
                  ) : (
                    <>
                      <Crown color="#1a1200" size={18} />
                      <Text style={styles.upgradeBtnTextDark}>
                        Upgrade to Premium — {selectedPlan === 'yearly' ? `$${yearlyPrice}/yr` : `$${monthlyPrice}/mo`}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Shield color={COLORS.textMuted} size={12} />
                  <Text style={styles.trustText}>Secure checkout by Stripe</Text>
                </View>
                <View style={styles.trustItem}>
                  <Check color={COLORS.textMuted} size={12} />
                  <Text style={styles.trustText}>Cancel anytime</Text>
                </View>
              </View>

              <Text style={styles.disclaimer}>
                Subscriptions auto-renew unless cancelled at least 24 hours before the period ends. Manage your subscription anytime in Settings.
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },
  ambientOrb: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(212,175,55,0.08)', top: -80, right: -100,
  },
  ambientOrb2: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(108,99,255,0.1)', bottom: 200, left: -80,
  },
  ambientOrb3: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(124,58,237,0.07)', bottom: 60, right: -40,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingBottom: 8,
  },
  eyebrow: {
    ...TEXT_PRESETS.labelSmall,
    color: COLORS.textMuted,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.glass,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 40 },
  // Hero
  heroSection: { alignItems: 'center', marginTop: 12, marginBottom: 28 },
  crownContainer: { position: 'relative', marginBottom: 14 },
  crownGlow: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  sparkle1: { position: 'absolute', top: 2, right: 0 },
  sparkle2: { position: 'absolute', bottom: 4, left: 2 },
  heroTitle: { ...TEXT_PRESETS.heroMedium, color: COLORS.textPrimary },
  heroSubtitle: {
    ...TEXT_PRESETS.bodyMedium, color: COLORS.textSecondary,
    textAlign: 'center', marginTop: 6, paddingHorizontal: 20,
  },
  // Trial card
  trialCardWrap: { marginBottom: 28, borderRadius: 20, overflow: 'hidden' },
  trialCard: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  trialHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  trialTitle: { ...TEXT_PRESETS.headingSmall, color: COLORS.textPrimary, fontWeight: '600' as const },
  trialDesc: { ...TEXT_PRESETS.bodySmall, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 14 },
  acceptRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, marginTop: 2,
    backgroundColor: COLORS.glass, borderWidth: 1.5, borderColor: COLORS.glassBorderBright,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  acceptText: { ...TEXT_PRESETS.caption, color: COLORS.textSecondary, flex: 1, lineHeight: 16 },
  trialButton: {
    backgroundColor: COLORS.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  trialButtonText: { ...TEXT_PRESETS.labelLarge, color: COLORS.bg, fontWeight: '700' as const },
  // Sections
  sectionTitle: {
    ...TEXT_PRESETS.labelMedium, color: COLORS.textMuted,
    marginBottom: 10, marginLeft: 4, marginTop: 4,
  },
  // Features
  featuresCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 4,
    marginBottom: 28,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  featureIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureText: { ...TEXT_PRESETS.bodyMedium, color: COLORS.textSecondary, flex: 1 },
  featureTextHighlight: { color: COLORS.textPrimary, fontWeight: '600' as const },
  featureSep: { height: 1, backgroundColor: COLORS.divider, marginHorizontal: 14 },
  newBadge: {
    backgroundColor: 'rgba(244,114,182,0.12)', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(244,114,182,0.25)',
  },
  newBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#F472B6', letterSpacing: 0.5 },
  // Plans
  planCard: { borderRadius: 18, marginBottom: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: 'transparent' },
  planCardSelected: { borderColor: COLORS.gold },
  planCardGrad: { padding: 16, position: 'relative' },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  planInfoCol: { flex: 1 },
  planName: { ...TEXT_PRESETS.headingSmall, color: COLORS.textPrimary, fontWeight: '600' as const, marginBottom: 6 },
  savingsBadge: {
    backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start',
  },
  savingsText: { fontSize: 11, fontWeight: '700' as const, color: COLORS.gold, letterSpacing: 0.3 },
  planPriceCol: { alignItems: 'flex-end' },
  planPrice: { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.textPrimary, lineHeight: 30 },
  planPeriod: { ...TEXT_PRESETS.caption, color: COLORS.textMuted },
  planBilling: { ...TEXT_PRESETS.caption, color: COLORS.textMuted, marginTop: 2 },
  planCheck: {
    position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
  },
  // Upgrade button
  upgradeButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, marginTop: 8 },
  upgradeGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 24, gap: 10,
  },
  upgradeBtnTextDark: { fontFamily: FONTS.body, fontSize: 15, fontWeight: '700' as const, color: '#1a1200', letterSpacing: 0.2 },
  // Trust row
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 14 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.2 },
  disclaimer: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', lineHeight: 16, paddingHorizontal: 12 },
  // Error
  errorCard: {
    backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)',
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  errorText: { fontSize: 13, color: '#F87171', lineHeight: 18 },
  // Active subscriber styles
  statusHero: { borderRadius: 22, overflow: 'hidden', marginBottom: 24, marginTop: 8 },
  statusHeroGrad: { padding: 20, borderRadius: 22, borderWidth: 1, borderColor: COLORS.glassBorder },
  statusHeroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  statusHeroBadge: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  statusHeroText: { flex: 1 },
  statusHeroLabel: { ...TEXT_PRESETS.headingMedium, color: COLORS.textPrimary },
  statusHeroSub: { ...TEXT_PRESETS.bodySmall, color: COLORS.textSecondary, marginTop: 2 },
  statusMetaRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusMetaItem: { flex: 1 },
  statusMetaLabel: { ...TEXT_PRESETS.labelSmall, color: COLORS.textMuted, marginBottom: 3 },
  statusMetaValue: { ...TEXT_PRESETS.bodyMedium, color: COLORS.textPrimary, fontWeight: '600' as const },
  statusMetaDivider: { width: 1, height: 28, backgroundColor: COLORS.dividerBright, marginHorizontal: 12 },
  benefitsCard: { borderRadius: 18, padding: 4, marginBottom: 24 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  benefitIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benefitText: { ...TEXT_PRESETS.bodyMedium, color: COLORS.textPrimary, flex: 1 },
  benefitSep: { height: 1, backgroundColor: COLORS.divider, marginHorizontal: 14 },
  managementCard: { borderRadius: 18, padding: 4, marginBottom: 20 },
  mgmtRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  mgmtIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mgmtText: { flex: 1 },
  mgmtTitle: { ...TEXT_PRESETS.bodyMedium, color: COLORS.textPrimary, fontWeight: '600' as const, marginBottom: 2 },
  mgmtSub: { ...TEXT_PRESETS.caption, color: COLORS.textMuted },
  mgmtSep: { height: 1, backgroundColor: COLORS.divider, marginHorizontal: 14 },
  secureNote: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', lineHeight: 16, marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  // Cancel confirmation sheet
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmSheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  confirmGradient: { padding: 24, borderRadius: 24, alignItems: 'center' },
  confirmIconWrap: { position: 'relative', marginBottom: 14 },
  confirmIconGlow: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(248,113,113,0.18)', top: -8, opacity: 0.7,
  },
  confirmIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(248,113,113,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmEyebrow: { ...TEXT_PRESETS.labelSmall, color: '#F87171', marginBottom: 6 },
  confirmTitle: { ...TEXT_PRESETS.headingLarge, color: COLORS.textPrimary, marginBottom: 10 },
  confirmBody: {
    ...TEXT_PRESETS.bodyMedium, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 18, paddingHorizontal: 4,
  },
  confirmBenefitsRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 8, marginBottom: 20, paddingHorizontal: 4,
  },
  confirmBenefitItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
  },
  confirmBenefitText: { fontSize: 11, fontWeight: '600' as const, color: COLORS.textSecondary, letterSpacing: 0.2 },
  confirmCancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, width: '100%',
    backgroundColor: 'rgba(248,113,113,0.9)', marginBottom: 10,
  },
  confirmCancelBtnText: { fontFamily: FONTS.body, fontSize: 15, fontWeight: '700' as const, color: '#fff', letterSpacing: 0.2 },
  confirmKeepBtn: {
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  confirmKeepBtnText: { fontFamily: FONTS.body, fontSize: 14, fontWeight: '600' as const, color: COLORS.textSecondary },
});
