import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Lightbulb,
  Heart,
  Brain,
  Zap,
  Music,
  Activity,
  Moon,
  Sparkles,
  ChevronRight,
  X,
  Search,
  Clock,
  Bookmark,
  Share2,
  Award,
  TrendingUp,
  Filter,
} from 'lucide-react-native';
import { useLearningContent } from '@/hooks/useLearningContent';
import { AudioPlayer } from '@/components/AudioPlayer';
import {
  SOLFEGGIO_FREQUENCIES,
  CHAKRA_FREQUENCIES,
  BINAURAL_BEATS,
  HEALING_FREQUENCIES,
  SLEEP_FREQUENCIES,
  WEALTH_FREQUENCIES,
  SCIENTIFIC_FREQUENCIES,
} from '@/constants/frequencies';
import { useTheme } from '@/hooks/useTheme';

interface Article {
  id: string;
  title: string;
  category: string;
  readTime: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  content: string;
  keyPoints: string[];
  practicalTips: string[];
  scientificBasis?: string;
  historicalContext?: string;
  icon: any;
  color: string;
  gradient: string[];
  isRead?: boolean;
  isFavorite?: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'All Topics', icon: BookOpen, color: '#A78BFA' },
  { id: 'solfeggio', name: 'Solfeggio', icon: Music, color: '#F472B6' },
  { id: 'chakras', name: 'Chakras', icon: Zap, color: '#FBBF24' },
  { id: 'brainwaves', name: 'Brainwaves', icon: Brain, color: '#818CF8' },
  { id: 'healing', name: 'Healing', icon: Heart, color: '#34D399' },
  { id: 'sleep', name: 'Sleep', icon: Moon, color: '#60A5FA' },
  { id: 'manifestation', name: 'Manifestation', icon: Sparkles, color: '#FBBF24' },
  { id: 'science', name: 'Science', icon: Activity, color: '#22D3EE' },
];

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Ancient Solfeggio Scale: History and Healing',
    category: 'solfeggio',
    readTime: 8,
    difficulty: 'Beginner',
    content: `The Solfeggio frequencies are a set of ancient musical tones that were rediscovered in the 1970s by Dr. Joseph Puleo. These frequencies are believed to have been used in sacred music, including Gregorian Chants, and are thought to possess unique healing properties.\n\nThe six main Solfeggio frequencies (396 Hz, 417 Hz, 528 Hz, 639 Hz, 741 Hz, 852 Hz) are said to correspond to different aspects of physical, emotional, and spiritual healing.`,
    keyPoints: [
      '396 Hz - Liberating guilt and fear',
      '417 Hz - Facilitating change and transformation',
      '528 Hz - The "Love Frequency" for DNA repair',
      '639 Hz - Harmonizing relationships',
      '741 Hz - Awakening intuition',
      '852 Hz - Returning to spiritual order',
    ],
    practicalTips: [
      'Start with 15-20 minute sessions',
      'Use headphones for better immersion',
      'Practice in a quiet, comfortable space',
      'Combine with meditation or breathwork',
    ],
    historicalContext: 'These frequencies were allegedly rediscovered from an ancient musical scale used in sacred music. The original scale was said to be used in Gregorian Chants.',
    scientificBasis: 'While scientific evidence is limited, some studies suggest certain frequencies can influence brainwave patterns and potentially affect mood and stress levels.',
    icon: Music,
    color: '#F472B6',
    gradient: ['#F472B6', '#DB2777'],
  },
  {
    id: '2',
    title: 'Understanding Your Chakras Through Sound',
    category: 'chakras',
    readTime: 10,
    difficulty: 'Intermediate',
    content: `The chakra system, originating from ancient Indian traditions, describes seven main energy centers in the body. Each chakra is associated with specific frequencies that can help balance and activate these energy centers.\n\nSound healing for chakras works on the principle of resonance — when a chakra is exposed to its corresponding frequency, it begins to vibrate in harmony.`,
    keyPoints: [
      'Root Chakra (194.18 Hz) - Grounding and stability',
      'Sacral Chakra (210.42 Hz) - Creativity',
      'Solar Plexus (126.22 Hz) - Personal power',
      'Heart Chakra (341.3 Hz) - Love and compassion',
      'Throat Chakra (384 Hz) - Communication',
      'Third Eye (426.7 Hz) - Intuition',
      'Crown Chakra (963 Hz) - Spiritual connection',
    ],
    practicalTips: [
      'Focus on one chakra at a time initially',
      'Visualize the chakra color while listening',
      'Use crystals to enhance the experience',
    ],
    historicalContext: 'The chakra system has been part of Hindu and Buddhist traditions for thousands of years.',
    icon: Zap,
    color: '#FBBF24',
    gradient: ['#FBBF24', '#D97706'],
  },
  {
    id: '3',
    title: 'Brainwave Entrainment: The Science of Mental States',
    category: 'brainwaves',
    readTime: 12,
    difficulty: 'Advanced',
    content: `Brainwave entrainment is a method to stimulate the brain into entering a specific state by using pulsing sound, light, or electromagnetic fields. The brain naturally synchronizes its brainwave frequencies with external stimuli through a process called frequency following response.`,
    keyPoints: [
      'Delta (0.5-4 Hz) - Deep sleep and healing',
      'Theta (4-8 Hz) - Deep meditation and creativity',
      'Alpha (8-13 Hz) - Relaxed awareness',
      'Beta (13-30 Hz) - Active thinking and focus',
      'Gamma (30-100 Hz) - Higher consciousness',
    ],
    practicalTips: [
      'Use stereo headphones for binaural beats',
      'Start with alpha waves for relaxation',
      'Combine with breathing exercises',
    ],
    scientificBasis: 'Numerous EEG studies have demonstrated that brainwave entrainment can effectively alter brainwave patterns.',
    icon: Brain,
    color: '#818CF8',
    gradient: ['#818CF8', '#6366F1'],
  },
  {
    id: '4',
    title: 'The 528 Hz Love Frequency: Miracle Tone Explained',
    category: 'healing',
    readTime: 7,
    difficulty: 'Beginner',
    content: `The 528 Hz frequency, often called the "Love Frequency" or "Miracle Tone," is perhaps the most famous of the Solfeggio frequencies. It is said to resonate at the heart of everything, connecting your heart, spiritual essence, and divine harmony.`,
    keyPoints: [
      'Associated with DNA repair and healing',
      'Promotes feelings of love and harmony',
      'May reduce stress and anxiety',
      'Resonates with natural geometric patterns',
    ],
    practicalTips: [
      'Listen during meditation or yoga',
      'Play softly during sleep',
      'Combine with positive affirmations',
    ],
    scientificBasis: 'A 2018 study found that 528 Hz music reduced stress in the endocrine and autonomic nervous systems.',
    icon: Heart,
    color: '#34D399',
    gradient: ['#34D399', '#059669'],
  },
  {
    id: '5',
    title: 'Optimizing Sleep with Delta and Theta Waves',
    category: 'sleep',
    readTime: 9,
    difficulty: 'Intermediate',
    content: `Quality sleep is essential for physical and mental health, and specific frequencies can help optimize your sleep cycles. Delta waves (0.5-4 Hz) are associated with deep, restorative sleep, while theta waves (4-8 Hz) are present during REM sleep.`,
    keyPoints: [
      'Delta waves promote deep, restorative sleep',
      'Theta waves enhance dream states',
      'Progressive frequency reduction mimics natural sleep onset',
      'Consistent use can improve sleep patterns',
    ],
    practicalTips: [
      'Start with alpha waves 30 minutes before bed',
      'Keep volume low and comfortable',
      'Use a sleep timer',
    ],
    scientificBasis: 'EEG studies confirm that delta waves are predominant during deep sleep stages 3 and 4.',
    icon: Moon,
    color: '#60A5FA',
    gradient: ['#60A5FA', '#3B82F6'],
  },
  {
    id: '6',
    title: 'Manifestation Frequencies: Aligning with Abundance',
    category: 'manifestation',
    readTime: 6,
    difficulty: 'Beginner',
    content: `Manifestation frequencies are based on the principle that everything in the universe vibrates at specific frequencies, including our thoughts and desires. Common manifestation frequencies include 888 Hz, 432 Hz, and 528 Hz.`,
    keyPoints: [
      '888 Hz - Abundance and prosperity',
      '432 Hz - Natural universal frequency',
      '528 Hz - Transformation and miracles',
      'Alpha waves for visualization',
    ],
    practicalTips: [
      'Combine with visualization exercises',
      'Use during affirmation practice',
      'Practice gratitude while listening',
    ],
    icon: Sparkles,
    color: '#FBBF24',
    gradient: ['#FBBF24', '#D97706'],
  },
  {
    id: '7',
    title: "The Schumann Resonance: Earth's Natural Frequency",
    category: 'science',
    readTime: 8,
    difficulty: 'Intermediate',
    content: `The Schumann Resonance, discovered in 1952, is the Earth's natural electromagnetic frequency, pulsing at approximately 7.83 Hz. This frequency falls within the alpha brainwave range and is thought to be the frequency at which all life on Earth has evolved.`,
    keyPoints: [
      'Earth resonates at 7.83 Hz',
      'Falls within alpha brainwave range',
      'May promote grounding and stability',
      'Supports circadian rhythm regulation',
    ],
    practicalTips: [
      'Use for grounding meditation',
      'Combine with earthing practices',
      'Practice in nature when possible',
    ],
    scientificBasis: 'The Schumann Resonance is a well-documented scientific phenomenon. Studies show exposure to 7.83 Hz can influence brainwave activity.',
    icon: Activity,
    color: '#22D3EE',
    gradient: ['#22D3EE', '#0891B2'],
  },
  {
    id: '8',
    title: '40 Hz Gamma Waves: Cognitive Enhancement',
    category: 'science',
    readTime: 10,
    difficulty: 'Advanced',
    content: `Recent research from MIT has shown that 40 Hz gamma wave stimulation may have profound effects on cognitive function, particularly in relation to Alzheimer's disease and memory enhancement.`,
    keyPoints: [
      'Enhances cognitive function',
      'May help clear brain plaques',
      'Improves memory consolidation',
      'Promotes heightened awareness',
    ],
    practicalTips: [
      'Use during study or work sessions',
      'Limit to 20-30 minute sessions',
      'Best used when fully awake',
    ],
    scientificBasis: 'MIT studies have shown 40 Hz stimulation can reduce beta-amyloid plaques in mouse models of Alzheimer\'s.',
    icon: Brain,
    color: '#A78BFA',
    gradient: ['#A78BFA', '#7C3AED'],
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: '#34D399',
  Intermediate: '#FBBF24',
  Advanced: '#F472B6',
};

const GlassCard = SharedGlassCard;

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const { colors, gradients, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, gradients), [colors, gradients]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [practiceFrequency, setPracticeFrequency] = useState<any>(null);

  const {
    progress,
    toggleFavorite,
    addSearchToHistory,
    startReadingSession,
    endReadingSession,
    getRecommendedArticles,
    getReadingStats,
  } = useLearningContent() || {
    progress: { favoriteArticles: [], readArticles: [] },
    toggleFavorite: () => {},
    addSearchToHistory: () => {},
    startReadingSession: () => {},
    endReadingSession: () => {},
    getRecommendedArticles: () => [],
    getReadingStats: { totalArticles: 0, currentStreak: 0, totalTime: 0, favoriteCount: 0 },
  };

  const bookmarkedArticles = progress?.favoriteArticles || [];

  const handleCloseArticle = useCallback(() => {
    endReadingSession();
    setSelectedArticle(null);
  }, [endReadingSession]);

  const handleStartPractice = useCallback((article: Article) => {
    const map: Record<string, any[]> = {
      solfeggio: SOLFEGGIO_FREQUENCIES,
      chakras: CHAKRA_FREQUENCIES,
      brainwaves: BINAURAL_BEATS,
      healing: HEALING_FREQUENCIES,
      sleep: SLEEP_FREQUENCIES,
      manifestation: WEALTH_FREQUENCIES,
      science: SCIENTIFIC_FREQUENCIES,
    };
    const freqs = map[article.category] || [];
    if (freqs.length > 0) {
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      setPracticeFrequency({ ...f, categoryContext: article.category, articleTitle: article.title });
      setShowAudioPlayer(true);
      endReadingSession();
      setSelectedArticle(null);
    }
  }, []);

  const handleContinueLearning = useCallback(() => {
    const recommended = getRecommendedArticles ? getRecommendedArticles(ARTICLES) : [];
    if (recommended?.length > 0) {
      setSelectedArticle(recommended[0]);
    } else {
      const unread = ARTICLES.filter(a => !progress?.readArticles?.includes(a.id));
      setSelectedArticle(unread.length > 0 ? unread[0] : ARTICLES[0]);
    }
  }, [getRecommendedArticles, progress?.readArticles]);

  useEffect(() => {
    if (selectedArticle) startReadingSession(selectedArticle.id);
  }, [selectedArticle]);

  useEffect(() => {
    if (searchQuery && filteredArticles.length > 0) addSearchToHistory(searchQuery, filteredArticles.length);
  }, [searchQuery]);

  const filteredArticles = ARTICLES.filter(a => {
    const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const stats = getReadingStats || { totalArticles: 0, currentStreak: 0, totalTime: 0, favoriteCount: 0 };
  const progressPct = Math.min(100, (stats.totalArticles / ARTICLES.length) * 100);

  const featuredArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={styles.ambientOrb} pointerEvents="none" />
      <View style={styles.ambientOrb2} pointerEvents="none" />
      <View style={styles.ambientOrb3} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Knowledge</Text>
            <Text style={styles.headerTitle}>Learn & Discover</Text>
          </View>
          <View style={styles.headerReadingBadge}>
            <TrendingUp size={13} color="#34D399" />
            <Text style={styles.headerReadingText}>{stats.totalArticles}/{ARTICLES.length}</Text>
          </View>
        </View>

        {/* Search */}
        <GlassCard style={styles.searchBar} depth="light">
          <Search color={colors.textMuted} size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={colors.textMuted} size={14} />
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catScrollContent}
        >
          {CATEGORIES.map(cat => {
            const IconComp = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)} activeOpacity={0.8}>
                <View style={[styles.catChip, isActive && { backgroundColor: cat.color + '20', borderColor: cat.color + '60' }]}>
                  <IconComp size={14} color={isActive ? cat.color : colors.textMuted} />
                  <Text style={[styles.catChipText, isActive && { color: cat.color }]}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Guide Card */}
        <GlassCard depth="deep" style={styles.guideCard}>
          <LinearGradient
            colors={['rgba(108,99,255,0.85)', 'rgba(124,58,237,0.8)']}
            style={styles.guideGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.guideTop}>
              <View style={styles.guideIconWrap}>
                <Award size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guideTitle}>Complete Frequency Guide</Text>
                <Text style={styles.guideDesc}>Master all frequency categories and unlock your full potential</Text>
              </View>
            </View>
            <View style={styles.guideProgressWrap}>
              <View style={styles.guideProgressBar}>
                <View style={[styles.guideProgressFill, { width: `${progressPct}%` as any }]} />
              </View>
              <Text style={styles.guideProgressText}>{stats.totalArticles} of {ARTICLES.length} completed</Text>
            </View>
            <View style={styles.guideStatsRow}>
              {[
                { val: stats.currentStreak, lbl: 'Day Streak' },
                { val: stats.totalTime, lbl: 'Min Read' },
                { val: stats.favoriteCount, lbl: 'Favorites' },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={styles.guideStatDivider} />}
                  <View style={styles.guideStat}>
                    <Text style={styles.guideStatVal}>{s.val}</Text>
                    <Text style={styles.guideStatLbl}>{s.lbl}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
            <TouchableOpacity style={styles.guideBtn} onPress={handleContinueLearning}>
              <Text style={styles.guideBtnText}>Continue Learning</Text>
              <ChevronRight size={15} color="#7C3AED" />
            </TouchableOpacity>
          </LinearGradient>
        </GlassCard>

        {/* Featured Article (Hero) */}
        {featuredArticle && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Articles</Text>
          </View>
        )}

        {featuredArticle && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedArticle(featuredArticle)}>
            <GlassCard style={styles.heroCard} depth="normal">
              <LinearGradient
                colors={[featuredArticle.color + '50', featuredArticle.color + '15', 'transparent']}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.heroContent}>
                <View style={[styles.heroIconWrap, { backgroundColor: featuredArticle.color + '25', borderColor: featuredArticle.color + '40' }]}>
                  {React.createElement(featuredArticle.icon, { size: 26, color: featuredArticle.color })}
                </View>
                <View style={styles.heroBadgeRow}>
                  <View style={[styles.heroCatBadge, { backgroundColor: featuredArticle.color + '20' }]}>
                    <Text style={[styles.heroCatBadgeText, { color: featuredArticle.color }]}>{featuredArticle.category}</Text>
                  </View>
                  <View style={[styles.heroDiffBadge, { backgroundColor: DIFFICULTY_COLORS[featuredArticle.difficulty] + '20' }]}>
                    <Text style={[styles.heroDiffText, { color: DIFFICULTY_COLORS[featuredArticle.difficulty] }]}>{featuredArticle.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>{featuredArticle.title}</Text>
                <Text style={styles.heroExcerpt} numberOfLines={2}>
                  {featuredArticle.content.substring(0, 110)}...
                </Text>
                <View style={styles.heroFooter}>
                  <View style={styles.heroMeta}>
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={styles.heroMetaText}>{featuredArticle.readTime} min read</Text>
                  </View>
                  <View style={[styles.heroReadBtn, { backgroundColor: featuredArticle.color + '20', borderColor: featuredArticle.color + '40' }]}>
                    <Text style={[styles.heroReadBtnText, { color: featuredArticle.color }]}>Read</Text>
                    <ChevronRight size={13} color={featuredArticle.color} />
                  </View>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Rest of articles */}
        {restArticles.map(article => {
          const IconComp = article.icon;
          const isBookmarked = bookmarkedArticles.includes(article.id);
          return (
            <TouchableOpacity key={article.id} activeOpacity={0.85} onPress={() => setSelectedArticle(article)}>
              <GlassCard style={styles.articleCard} depth="normal">
                <LinearGradient
                  colors={[article.color + '18', article.color + '05', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  pointerEvents="none"
                />
                {/* Top accent line */}
                <View style={[styles.articleTopAccent, { backgroundColor: article.color + '60' }]} />

                <View style={styles.articleCardHeader}>
                  <View style={[styles.articleIconWrap, { backgroundColor: article.color + '20', borderColor: article.color + '35' }]}>
                    <IconComp size={20} color={article.color} />
                  </View>
                  <View style={styles.articleHeaderMeta}>
                    <View style={[styles.articleCatBadge, { backgroundColor: article.color + '18', borderColor: article.color + '35' }]}>
                      <Text style={[styles.articleCatBadgeText, { color: article.color }]}>{article.category}</Text>
                    </View>
                    <View style={[styles.articleDiffBadge, { backgroundColor: DIFFICULTY_COLORS[article.difficulty] + '18' }]}>
                      <Text style={[styles.articleDiffText, { color: DIFFICULTY_COLORS[article.difficulty] }]}>{article.difficulty}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.articleBookmarkBtn}
                    onPress={() => toggleFavorite(article.id)}
                  >
                    <Bookmark
                      size={16}
                      color={isBookmarked ? article.color : colors.textMuted}
                      fill={isBookmarked ? article.color : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
                <Text style={styles.articleExcerpt} numberOfLines={2}>
                  {article.content.substring(0, 100)}...
                </Text>

                <View style={styles.articleFooter}>
                  <View style={styles.articleMeta}>
                    <Clock size={11} color={colors.textMuted} />
                    <Text style={styles.articleMetaText}>{article.readTime} min read</Text>
                  </View>
                  <View style={[styles.articleReadBtn, { backgroundColor: article.color + '18', borderColor: article.color + '40' }]}>
                    <Text style={[styles.articleReadBtnText, { color: article.color }]}>Read</Text>
                    <ChevronRight size={12} color={article.color} />
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        {/* Tip Card */}
        <GlassCard style={styles.tipCard} depth="light">
          <View style={styles.tipRow}>
            <Lightbulb color={colors.gold} size={18} />
            <Text style={styles.tipTitle}>Daily Learning Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Start with one frequency category and master it before moving to the next. Consistency is more effective than variety.
          </Text>
        </GlassCard>

      </ScrollView>

      {/* Article Modal */}
      {selectedArticle && (
        <Modal visible animationType="slide" presentationStyle="fullScreen">
          <View style={styles.modalWrap}>
            <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            {/* Ambient color orb from article */}
            <View style={[styles.modalAmbientOrb, { backgroundColor: selectedArticle.color + '12' }]} pointerEvents="none" />
            <View style={[styles.modalAmbientOrb2, { backgroundColor: selectedArticle.color + '07' }]} pointerEvents="none" />

            {/* Sticky header */}
            <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={handleCloseArticle}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={[styles.modalCatPill, { backgroundColor: selectedArticle.color + '18', borderColor: selectedArticle.color + '35' }]}>
                {React.createElement(selectedArticle.icon, { size: 12, color: selectedArticle.color })}
                <Text style={[styles.modalCatPillText, { color: selectedArticle.color }]}>{selectedArticle.category}</Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => toggleFavorite(selectedArticle.id)}
                >
                  <Bookmark
                    size={17}
                    color={bookmarkedArticles.includes(selectedArticle.id) ? selectedArticle.color : colors.textSecondary}
                    fill={bookmarkedArticles.includes(selectedArticle.id) ? selectedArticle.color : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + 100 }]}
            >
              {/* Hero Banner */}
              <LinearGradient
                colors={[selectedArticle.color + '35', selectedArticle.color + '15', 'transparent']}
                style={styles.modalHeroBand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.modalHeroIconLarge, {
                  backgroundColor: selectedArticle.color + '25',
                  borderColor: selectedArticle.color + '45',
                  shadowColor: selectedArticle.color,
                }]}>
                  {React.createElement(selectedArticle.icon, { size: 38, color: selectedArticle.color })}
                </View>
                <View style={styles.modalHeroBadgeRow}>
                  <View style={[styles.modalHeroDiffBadge, { backgroundColor: DIFFICULTY_COLORS[selectedArticle.difficulty] + '22' }]}>
                    <Text style={[styles.modalHeroDiffText, { color: DIFFICULTY_COLORS[selectedArticle.difficulty] }]}>{selectedArticle.difficulty}</Text>
                  </View>
                  <View style={styles.modalHeroMeta}>
                    <Clock size={11} color={colors.textMuted} />
                    <Text style={styles.modalHeroMetaText}>{selectedArticle.readTime} min read</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Title block */}
              <View style={styles.modalTitleBlock}>
                <Text style={styles.modalTitle}>{selectedArticle.title}</Text>
                <View style={[styles.modalTitleAccent, { backgroundColor: selectedArticle.color + '50' }]} />
              </View>

              {/* Body text */}
              <View style={styles.modalBodyWrap}>
                {selectedArticle.content.split('\n\n').map((para, i) => (
                  <Text key={i} style={[styles.modalBody, i > 0 && { marginTop: 16 }]}>{para}</Text>
                ))}
              </View>

              {/* Info cards */}
              {(selectedArticle.scientificBasis || selectedArticle.historicalContext) && (
                <View style={styles.infoBoxRow}>
                  {selectedArticle.scientificBasis && (
                    <GlassCard style={styles.infoBox} depth="light">
                      <LinearGradient
                        colors={['rgba(34,211,238,0.08)', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                      <View style={styles.infoBoxHeader}>
                        <View style={styles.infoBoxIconWrap}>
                          <Activity size={14} color="#22D3EE" />
                        </View>
                        <Text style={styles.infoBoxTitle}>Scientific Basis</Text>
                      </View>
                      <Text style={styles.infoBoxText}>{selectedArticle.scientificBasis}</Text>
                    </GlassCard>
                  )}
                  {selectedArticle.historicalContext && (
                    <GlassCard style={styles.infoBox} depth="light">
                      <LinearGradient
                        colors={[colors.accent + '08', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                      <View style={styles.infoBoxHeader}>
                        <View style={[styles.infoBoxIconWrap, { backgroundColor: colors.accent + '20' }]}>
                          <BookOpen size={14} color={colors.accent} />
                        </View>
                        <Text style={styles.infoBoxTitle}>Historical Context</Text>
                      </View>
                      <Text style={styles.infoBoxText}>{selectedArticle.historicalContext}</Text>
                    </GlassCard>
                  )}
                </View>
              )}

              {/* Key Points */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <View style={[styles.modalSectionAccentLine, { backgroundColor: selectedArticle.color }]} />
                  <Text style={styles.modalSectionTitle}>Key Points</Text>
                </View>
                <View style={styles.keyPointsList}>
                  {selectedArticle.keyPoints.map((point, i) => (
                    <View key={i} style={[styles.keyPointRow, { borderLeftColor: selectedArticle.color + '50' }]}>
                      <View style={[styles.keyPointNumber, { backgroundColor: selectedArticle.color + '20', borderColor: selectedArticle.color + '40' }]}>
                        <Text style={[styles.keyPointNumberText, { color: selectedArticle.color }]}>{i + 1}</Text>
                      </View>
                      <Text style={styles.keyPointText}>{point}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Practical Tips */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <View style={[styles.modalSectionAccentLine, { backgroundColor: colors.gold }]} />
                  <Text style={styles.modalSectionTitle}>Practical Tips</Text>
                </View>
                <GlassCard style={styles.tipsContainer} depth="light">
                  <LinearGradient
                    colors={[colors.goldGlow, 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    pointerEvents="none"
                  />
                  {selectedArticle.practicalTips.map((tip, i) => (
                    <View key={i} style={[styles.tipItemRow, i < selectedArticle.practicalTips.length - 1 && styles.tipItemBorder]}>
                      <View style={styles.tipBullet}>
                        <Lightbulb size={13} color={colors.gold} />
                      </View>
                      <Text style={styles.tipItemText}>{tip}</Text>
                    </View>
                  ))}
                </GlassCard>
              </View>
            </ScrollView>

            {/* Floating practice CTA */}
            <View style={[styles.modalFloatingBar, { paddingBottom: insets.bottom + 12 }]}>
              <LinearGradient
                colors={['rgba(10,14,26,0)', 'rgba(10,14,26,0.98)', 'rgba(10,14,26,1)']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <TouchableOpacity
                style={[styles.practiceBtn, { shadowColor: selectedArticle.color }]}
                onPress={() => handleStartPractice(selectedArticle)}
              >
                <LinearGradient
                  colors={[selectedArticle.color, selectedArticle.color + 'CC']}
                  style={styles.practiceBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.practiceBtnText}>Start Practice Session</Text>
                  <ChevronRight size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <AudioPlayer
        visible={showAudioPlayer}
        onClose={() => setShowAudioPlayer(false)}
        frequency={practiceFrequency}
      />
    </View>
  );
}

const createStyles = (colors: any, gradients: any) => StyleSheet.create({
  container: { flex: 1 },
  ambientOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(108,99,255,0.09)',
    top: -50,
    right: -80,
  },
  ambientOrb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(244,114,182,0.06)',
    bottom: 300,
    left: -50,
  },
  ambientOrb3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(52,211,153,0.05)',
    bottom: 120,
    right: 20,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headerReadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 4,
  },
  headerReadingText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#34D399',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    gap: 10,
    marginBottom: 16,
    backgroundColor: colors.glassMid,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  catScroll: { marginBottom: 20 },
  catScrollContent: { paddingRight: 8, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 6,
    marginRight: 8,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  // Guide Card
  guideCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 24,
  },
  guideGradient: {
    padding: 20,
    borderRadius: 22,
  },
  guideTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  guideIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  guideDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  guideProgressWrap: { marginBottom: 16 },
  guideProgressBar: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  guideProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  guideProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  guideStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  guideStat: { alignItems: 'center' },
  guideStatVal: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.2,
  },
  guideStatLbl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  guideStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  guideBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#7C3AED',
    letterSpacing: 0.2,
  },
  // Section header
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  // Hero card (editorial)
  heroCard: {
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  heroContent: { padding: 20 },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  heroCatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroCatBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  heroDiffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroDiffText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 27,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  heroExcerpt: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroMetaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  heroReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  heroReadBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  // Article cards
  articleCard: {
    borderRadius: 22,
    marginBottom: 14,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  articleTopAccent: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
  },
  articleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  articleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  articleHeaderMeta: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  articleCatBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  articleCatBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  articleDiffBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  articleDiffText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  articleBookmarkBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 22,
    letterSpacing: 0.15,
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  articleMetaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  articleDiffDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
  },
  articleExcerpt: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  articleReadBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  // Tip card
  tipCard: {
    padding: 18,
    borderRadius: 18,
    marginTop: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Modal
  modalWrap: { flex: 1 },
  modalAmbientOrb: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -80,
    right: -80,
  },
  modalAmbientOrb2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: 150,
    left: -80,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  modalCatPillText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
    letterSpacing: 0.3,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    paddingHorizontal: 22,
  },
  modalHeroBand: {
    marginHorizontal: -22,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 16,
  },
  modalHeroIconLarge: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeroDiffBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  modalHeroDiffText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  modalHeroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalHeroMetaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  modalTitleBlock: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 35,
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  modalTitleAccent: {
    height: 2,
    width: 40,
    borderRadius: 1,
  },
  modalBodyWrap: {
    marginBottom: 28,
  },
  modalBody: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 28,
    letterSpacing: 0.15,
  },
  infoBoxRow: {
    gap: 12,
    marginBottom: 28,
  },
  infoBox: {
    padding: 18,
    borderRadius: 18,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  infoBoxIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(34,211,238,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  infoBoxText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  modalSection: {
    marginBottom: 28,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalSectionAccentLine: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  keyPointsList: {
    gap: 10,
  },
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(167,139,250,0.3)',
  },
  keyPointNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
    marginTop: 1,
  },
  keyPointNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  keyPointText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 22,
    paddingTop: 3,
  },
  tipsContainer: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  tipItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tipItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tipBullet: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.goldGlow,
    borderWidth: 1,
    borderColor: colors.gold + '30',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  tipItemText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 22,
    paddingTop: 3,
  },
  modalFloatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 32,
  },
  practiceBtn: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  practiceBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
  },
  practiceBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
});

type LearnStyles = ReturnType<typeof createStyles>;
