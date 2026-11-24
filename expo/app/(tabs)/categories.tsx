import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Keyboard,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlobalSearchParams } from 'expo-router';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';
import { useResponsive } from '@/lib/ui/responsive';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Moon, Waves, Target, Flower2, Sparkles, Heart, Leaf, Eye, Globe, Grid, List, Info, Play, Search, X, Crown, SlidersHorizontal } from 'lucide-react-native';
import { FrequencyInfoModal } from '@/components/FrequencyInfoModal';
import { PremiumGate } from '@/components/PremiumGate';
import { usePlayer } from '@/lib/player/PlayerContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useFrequencies } from '@/hooks/useDataHelpers';
import { useDataInitialization } from '@/hooks/useDataInitialization';
import { usePremiumUsage } from '@/hooks/usePremiumUsage';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  INTENT_CATEGORIES,
  type IntentCategoryId,
  type IntentCategoryDefinition,
  frequencyIdsForIntent,
  frequencyMatchesIntentQuery,
  intentsMatchingQuery,
  primaryIntentForFrequency,
  visibleIntentCategories,
} from '@/lib/catalogue/intent-taxonomy';
import { pluralTracks, t } from '@/lib/copy/strings';

type TabType = 'overview' | 'library';
type CategoryType = 'all' | IntentCategoryId;

const INTENT_ICONS: Record<string, any> = {
  moon: Moon,
  waves: Waves,
  target: Target,
  lotus: Flower2,
  sparkles: Sparkles,
  heart: Heart,
  leaf: Leaf,
  eye: Eye,
  globe: Globe,
};

const TRUST_TRIANGLE_FREE_HZ = [432, 528, 639, 7.83, 8];

const isFrequencyGated = (freq: any): boolean => {
  if (typeof freq?.isPremium === 'boolean') {
    return freq.isPremium;
  }
  return !TRUST_TRIANGLE_FREE_HZ.includes(freq?.hz);
};

const GlassCard = SharedGlassCard;

export default function CategoriesScreen() {
  const params = useGlobalSearchParams<{ frequencyHz?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, gradients, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { contentWidth } = useResponsive();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoFrequency, setInfoFrequency] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const { open: openPlayer } = usePlayer();
  const { isPlaying, currentFrequency } = useAudioPlayer();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'overview' ? 0 : 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [activeTab]);

  const { frequencies } = useFrequencies();
  const { isInitialized, isLoading } = useDataInitialization();
  const { isPremium } = useAuth();
  const { showPremiumGate, gateConfig, closePremiumGate } = usePremiumUsage();

  useEffect(() => {
    if (!params.frequencyHz) return;
    const target = getAllFrequencies().find((frequency) => String(frequency.hz) === String(params.frequencyHz));
    if (target) {
      setActiveTab('library');
      setSelectedCategory('all');
      openPlayer({ frequency: target });
    }
  }, [params.frequencyHz, frequencies]);

  const categories = useMemo(() => {
    const availableIds = frequencies.map((frequency: any) => frequency.id);
    return visibleIntentCategories(availableIds).map((definition: IntentCategoryDefinition) => {
      const ids = frequencyIdsForIntent(definition.id);
      const data = frequencies.filter((frequency: any) => ids.includes(frequency.id));
      return {
        ...definition,
        data,
        icon: INTENT_ICONS[definition.icon],
        description: definition.subtitle,
        isPremium: data.length > 0 && data.every((frequency: any) => isFrequencyGated(frequency)),
      };
    });
  }, [frequencies]);

  const withIntent = (frequency: any) => {
    const intentId = primaryIntentForFrequency(frequency.id);
    const intent = INTENT_CATEGORIES.find((category) => category.id === intentId);
    return {
      ...frequency,
      categoryId: intent?.id ?? frequency.category,
      intentName: intent?.name ?? frequency.category,
      intentColor: intent?.color,
    };
  };

  const getAllFrequencies = () => frequencies.map(withIntent);

  const matchesSearch = (frequency: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      frequency.name?.toLowerCase().includes(q) ||
      String(frequency.hz ?? '').includes(q) ||
      frequency.description?.toLowerCase().includes(q) ||
      (frequency.benefits ?? []).some((benefit: string) => benefit.toLowerCase().includes(q)) ||
      frequencyMatchesIntentQuery(frequency.id, searchQuery)
    );
  };

  const getFilteredFrequencies = () => {
    let freqs: any[] = [];
    if (selectedCategory === 'all') {
      freqs = getAllFrequencies();
    } else {
      const cat = categories.find((c: any) => c.id === selectedCategory);
      if (!cat) return [];
      freqs = cat.data.map(withIntent);
    }
    return freqs.filter(matchesSearch);
  };

  const getFilteredCategories = () => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    const matchedIntents = intentsMatchingQuery(searchQuery);
    return categories.filter((cat: any) =>
      cat.name.toLowerCase().includes(q) ||
      cat.subtitle.toLowerCase().includes(q) ||
      matchedIntents.includes(cat.id) ||
      cat.data.some((frequency: any) => matchesSearch(frequency))
    );
  };

  const handleCategorySelect = (categoryId: CategoryType) => {
    setSelectedCategory(categoryId);
    setActiveTab('library');
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      setSelectedCategory('all');
    }
  };

  const renderOverview = () => {
    const filtered = getFilteredCategories();
    return (
      <View style={{ flex: 1 }}>
        {/* Search Bar — only in Overview */}
        <View style={styles.searchRow}>
          <GlassCard style={styles.searchBar} depth="light">
            <Search color={colors.textMuted} size={16} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={t('common.search.placeholder')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); searchInputRef.current?.blur(); }}>
                <X color={colors.textMuted} size={14} />
              </TouchableOpacity>
            )}
          </GlassCard>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { maxWidth: contentWidth, width: '100%', alignSelf: 'center' }]}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Search color={colors.textMuted} size={36} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{t('explore.empty.title')}</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>{t('explore.empty.body')}</Text>
            </View>
          ) : (
            <ResponsiveGrid
              items={filtered}
              keyExtractor={(cat: any) => cat.id}
              renderItem={(cat: any) => {
                const IconComp = cat.icon;
                const accent = cat.color;
                return (
                  <TouchableOpacity activeOpacity={0.85} onPress={() => handleCategorySelect(cat.id)}>
                    <GlassCard style={styles.catCard} depth="normal">
                    <View style={[styles.catCardTopBorder, { backgroundColor: accent, opacity: 0.5 }]} />

                    <View style={styles.catCardHeader}>
                      <View style={[styles.catIconWrap, { borderColor: accent + '30' }]}>
                        <IconComp color={accent} size={22} />
                      </View>
                      <View style={styles.catCardHeaderText}>
                        <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
                        <Text style={[styles.catCount, { color: colors.textMuted }]}>{t('explore.category.tracks', { count: cat.data.length })}</Text>
                      </View>
                      {cat.isPremium && !isPremium && (
                        <View style={styles.premiumBadge}>
                          <Crown color={colors.gold} size={12} />
                        </View>
                      )}
                    </View>

                    <Text style={[styles.catDescription, { color: colors.textSecondary }]}>{cat.description}</Text>

                    <View style={styles.catPreviewList}>
                      {cat.data.slice(0, 3).map((freq: any, idx: number) => {
                        const gated = isFrequencyGated(freq);
                        return (
                          <View key={idx} style={styles.catPreviewRow}>
                            <View style={[styles.catBullet, { backgroundColor: accent }]} />
                            <Text style={[styles.catPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>{freq.name} — <Text style={{ color: accent }}>{freq.hz}Hz</Text></Text>
                            {gated && (
                              <View style={styles.miniPremiumBadge}>
                                <Crown color={colors.gold} size={10} />
                                <Text style={styles.miniPremiumText}>{t('explore.badge.preview').toUpperCase()}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                      {cat.data.length > 3 && (
                        <Text style={[styles.catMoreText, { color: colors.textMuted }]}>{t('explore.category.more', { count: cat.data.length - 3 })}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.catSelectBtn, { borderColor: accent + '40' }]}
                      onPress={() => handleCategorySelect(cat.id)}
                    >
                      <IconComp color={accent} size={14} />
                      <Text style={[styles.catSelectBtnText, { color: accent }]}>{t('explore.category.explore', { name: cat.name })}</Text>
                    </TouchableOpacity>
                    </GlassCard>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </ScrollView>
      </View>
    );
  };

  const renderLibrary = () => {
    const freqs = getFilteredFrequencies();
    const activeCategory = categories.find((c: any) => c.id === selectedCategory);
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.searchRow}>
          <GlassCard style={styles.searchBar} depth="light">
            <Search color={colors.textMuted} size={16} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={t('common.search.placeholder')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color={colors.textMuted} size={14} />
              </TouchableOpacity>
            )}
          </GlassCard>
        </View>

        {/* Intent filter tabs */}
        <View style={styles.libFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.libFilterContent}
            style={styles.libFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.libFilterTab,
                selectedCategory === 'all' && styles.libFilterTabActive,
              ]}
              onPress={() => setSelectedCategory('all')}
              activeOpacity={0.8}
            >
              <Grid color={selectedCategory === 'all' ? '#fff' : colors.textMuted} size={13} />
              <Text style={[styles.libFilterTabText, selectedCategory === 'all' && styles.libFilterTabTextActive]}>
                All
              </Text>
              <View style={[styles.libFilterCount, selectedCategory === 'all' && styles.libFilterCountActive]}>
                <Text style={[styles.libFilterCountText, selectedCategory === 'all' && styles.libFilterCountTextActive]}>
                  {getAllFrequencies().length}
                </Text>
              </View>
            </TouchableOpacity>

            {categories.map((cat: any) => {
              const IconComp = cat.icon;
              const accent = cat.color;
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.libFilterTab,
                    active && [styles.libFilterTabActiveColored, { backgroundColor: accent + '25', borderColor: accent + '60' }],
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <IconComp color={active ? accent : colors.textMuted} size={13} />
                  <Text style={[styles.libFilterTabText, active && { color: accent, fontWeight: '700' as const }]}>
                    {cat.name}
                  </Text>
                  <View style={[
                    styles.libFilterCount,
                    active && { backgroundColor: accent + '30', borderColor: accent + '40' }
                  ]}>
                    <Text style={[styles.libFilterCountText, active && { color: accent }]}>
                      {cat.data.length}
                    </Text>
                  </View>
                  {active && <View style={[styles.libFilterActiveDot, { backgroundColor: accent }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.libDivider} />

        <View style={styles.resultsRow}>
          <SlidersHorizontal color={colors.textMuted} size={13} />
          <Text style={styles.resultsText}>
            {pluralTracks(freqs.length)}
          </Text>
          {activeCategory && (
            <View style={styles.resultsCatTag}>
              <Text style={styles.resultsCatTagText}>{activeCategory.name}</Text>
            </View>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.libScrollContent}
        >
          {freqs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>{t('explore.library.empty.title')}</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>{t('explore.empty.body')}</Text>
            </View>
          ) : (
            freqs.map((freq) => {
              const accent = freq.intentColor || colors.accent;
              const isGated = isFrequencyGated(freq);
              const isActiveTrack = isPlaying && currentFrequency === freq.hz;
              return (
                <GlassCard
                  key={`${freq.categoryId}-${freq.hz}-${freq.name}`}
                  style={isActiveTrack ? [styles.freqCard, styles.freqCardActive] : styles.freqCard}
                  depth="normal"
                >
                  <View style={[styles.freqCardTopBorder, { backgroundColor: accent, opacity: 0.5 }]} />

                  <View style={styles.freqCardInner}>
                    <View style={[styles.freqCardLeft, { borderColor: accent + '30' }]}>
                      {isGated && (
                        <View style={styles.freqHzCrownBadge}>
                          <Crown color={colors.gold} size={10} />
                        </View>
                      )}
                      <Text style={[styles.freqHz, { color: accent }]}>{freq.hz}</Text>
                      <Text style={[styles.freqHzLabel, { color: accent + 'AA' }]}>Hz</Text>
                    </View>

                    <View style={styles.freqCardBody}>
                      <View style={styles.freqCardTopRow}>
                        <Text style={[styles.freqName, { color: colors.textPrimary }]}>{freq.name}</Text>
                        <View style={styles.badgeGroup}>
                          {isGated && (
                            <View style={styles.freqPremiumBadge}>
                              <Crown color={colors.gold} size={10} />
                              <Text style={styles.freqPremiumBadgeText}>{t('explore.badge.preview').toUpperCase()}</Text>
                            </View>
                          )}
                          <View style={[styles.freqCatBadge, { borderColor: accent + '30' }]}>
                            <Text style={[styles.freqCatBadgeText, { color: accent }]}>{freq.intentName}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.freqDesc, { color: colors.textMuted }]} numberOfLines={2}>{freq.description}</Text>
                      {freq.benefits && freq.benefits.length > 0 && (
                        <View style={styles.freqBenefits}>
                          {freq.benefits.slice(0, 2).map((b: string, idx: number) => (
                            <View key={idx} style={styles.freqBenefitRow}>
                              <View style={[styles.freqBenefitDot, { backgroundColor: accent }]} />
                              <Text style={[styles.freqBenefitText, { color: colors.textSecondary }]} numberOfLines={1}>{b}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.freqCardActions}>
                      <TouchableOpacity
                        style={[styles.freqInfoBtn, { borderColor: accent + '30' }]}
                        onPress={() => { setInfoFrequency(freq); setInfoModalVisible(true); }}
                      >
                        <Info color={accent} size={15} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.freqPlayBtn,
                          { backgroundColor: isGated && !isPremium ? colors.gold : accent }
                        ]}
                        onPress={() => openPlayer({ frequency: freq })}
                      >
                        <Play color="#fff" size={14} fill="#fff" />
                      </TouchableOpacity>
                      {isGated && !isPremium && (
                        <Text style={styles.previewTagText}>{t('explore.badge.preview')}</Text>
                      )}
                    </View>
                  </View>
                </GlassCard>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  if (isLoading && !isInitialized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <LinearGradient colors={gradients.bg as any} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={[styles.safeArea, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Frequencies...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={gradients.bg as any} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={[styles.ambientOrb1, { backgroundColor: isDark ? 'rgba(108,99,255,0.11)' : 'rgba(108,99,255,0.06)' }]} pointerEvents="none" />
      <View style={[styles.ambientOrb2, { backgroundColor: isDark ? 'rgba(244,114,182,0.07)' : 'rgba(244,114,182,0.04)' }]} pointerEvents="none" />
      <View style={[styles.ambientOrb3, { backgroundColor: isDark ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.03)' }]} pointerEvents="none" />

      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { maxWidth: contentWidth, width: '100%', alignSelf: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerEyebrow, { color: colors.textMuted }]}>{t('explore.eyebrow')}</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('explore.title')}</Text>
          </View>
          <View style={[styles.headerFreqBadge, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Zap color={colors.accent} size={14} />
            <Text style={[styles.headerFreqBadgeText, { color: colors.accent }]}>{getAllFrequencies().length}</Text>
          </View>
        </View>

        {/* Tab Bar — Overview | Library */}
        <View style={[styles.tabBarWrapper, { maxWidth: contentWidth, width: '100%', alignSelf: 'center' }]}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => switchTab('overview')}
              activeOpacity={0.8}
            >
              <Grid color={activeTab === 'overview' ? colors.accent : colors.textMuted} size={15} />
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>{t('explore.tab.overview')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'library' && styles.tabActive]}
              onPress={() => switchTab('library')}
              activeOpacity={0.8}
            >
              <List color={activeTab === 'library' ? colors.accent : colors.textMuted} size={15} />
              <Text style={[styles.tabText, activeTab === 'library' && styles.tabTextActive]}>{t('explore.tab.library')}</Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{getAllFrequencies().length}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'overview' ? renderOverview() : renderLibrary()}
        </View>
      </View>

      {infoFrequency && (
        <FrequencyInfoModal
          visible={infoModalVisible}
          onClose={() => { setInfoModalVisible(false); setInfoFrequency(null); }}
          frequency={infoFrequency}
          category={infoFrequency.category}
        />
      )}

      <PremiumGate
        visible={showPremiumGate}
        onClose={closePremiumGate}
        feature={gateConfig.feature}
        description={gateConfig.description}
        icon={gateConfig.icon}
      />
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  ambientOrb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(108,99,255,0.11)',
    top: -60,
    right: -90,
  },
  ambientOrb2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244,114,182,0.07)',
    bottom: 280,
    left: -60,
  },
  ambientOrb3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(52,211,153,0.05)',
    bottom: 100,
    right: -30,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerFreqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorder : 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  headerFreqBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  // Tab Bar
  tabBarWrapper: {
    paddingHorizontal: 22,
    marginBottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: isDark ? colors.accentSoft : 'rgba(108,99,255,0.18)',
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorderBright : 'rgba(108,99,255,0.35)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: '700' as const,
  },
  tabBadge: {
    backgroundColor: isDark ? colors.glassMid : 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorder : 'rgba(255,255,255,0.1)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  // Overview: Search
  searchRow: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 2 : 0,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: colors.textMuted,
  },
  // Category Cards (Overview)
  catCard: {
    borderRadius: 22,
    marginBottom: 16,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  catCardTopBorder: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
  },
  catCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  catIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.05)',
  },
  catCardHeaderText: { flex: 1 },
  catName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  catCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  premiumBadge: {
    backgroundColor: isDark ? colors.goldGlow : 'rgba(212,175,55,0.12)',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: isDark ? colors.gold : 'rgba(212,175,55,0.25)',
  },
  catDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  catPreviewList: {
    marginBottom: 14,
    gap: 6,
  },
  catPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  catPreviewText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  catMoreText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500' as const,
    marginLeft: 13,
  },
  catSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 7,
    borderWidth: 1,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.04)',
  },
  catSelectBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  // Library: Filter tabs
  libFilterContainer: {
    paddingTop: 14,
    paddingBottom: 2,
  },
  libFilterScroll: {
    flexGrow: 0,
  },
  libFilterContent: {
    paddingHorizontal: 22,
    gap: 8,
    paddingVertical: 4,
  },
  libFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorder : 'rgba(255,255,255,0.08)',
    gap: 6,
    position: 'relative',
  },
  libFilterTabActive: {
    backgroundColor: isDark ? colors.accentSoft : 'rgba(167,139,250,0.15)',
    borderColor: isDark ? colors.glassBorderBright : 'rgba(167,139,250,0.4)',
  },
  libFilterTabActiveColored: {},
  libFilterTabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  libFilterTabTextActive: {
    color: colors.accent,
    fontWeight: '700' as const,
  },
  libFilterCount: {
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.05)',
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorder : 'rgba(255,255,255,0.08)',
    minWidth: 22,
    alignItems: 'center',
  },
  libFilterCountActive: {
    backgroundColor: isDark ? colors.glassMid : 'rgba(255,255,255,0.08)',
    borderColor: isDark ? colors.glassBorderBright : 'rgba(255,255,255,0.12)',
  },
  libFilterCountText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.textMuted,
  },
  libFilterCountTextActive: {
    color: colors.accent,
  },
  libFilterActiveDot: {
    position: 'absolute',
    bottom: 4,
    left: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
  },
  libDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 22,
    marginTop: 10,
    marginBottom: 2,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    flex: 1,
  },
  resultsCatTag: {
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorder : 'rgba(255,255,255,0.1)',
  },
  resultsCatTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  libScrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    paddingTop: 4,
  },
  // Frequency Cards
  freqCard: {
    borderRadius: 22,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  freqCardActive: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  freqCardTopBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    borderRadius: 1,
    zIndex: 1,
    opacity: 0.6,
  },
  freqCardInner: {
    flexDirection: 'row',
    padding: 16,
    gap: 13,
    alignItems: 'flex-start',
  },
  freqCardLeft: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.04)',
  },
  freqHz: {
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  freqHzLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  freqCardBody: { flex: 1 },
  freqCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 8,
  },
  freqName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  freqCatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.05)',
  },
  freqCatBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  freqDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  freqBenefits: { gap: 4 },
  freqBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freqBenefitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  freqBenefitText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  freqCardActions: {
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  freqHzCrownBadge: {
    position: 'absolute',
    top: 3,
    right: 4,
  },
  freqPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freqPremiumBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  miniPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  miniPremiumText: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: colors.gold,
  },
  previewTagText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: colors.gold,
    textAlign: 'center',
  },
  freqInfoBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.05)',
  },
  freqPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type CategoryStyles = ReturnType<typeof createStyles>;
