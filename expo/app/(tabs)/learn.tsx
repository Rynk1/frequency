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
import { useLearningArticles } from '@/hooks/useDataHelpers';
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
import { useGlobalSearchParams } from 'expo-router';

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

const STATIC_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Solfeggio Frequencies: Ancient Tones for Modern Healing',
    category: 'solfeggio',
    readTime: 6,
    difficulty: 'Beginner',
    content: `Solfeggio frequencies represent a system of musical tones popular in contemporary sound-healing and wellness traditions. The modern scale commonly includes 396 Hz, 417 Hz, 528 Hz, 639 Hz, 741 Hz, and 852 Hz.\n\nWhile popular accounts frequently attribute these tones directly to ancient Medieval Gregorian chants, historical claims linking the complete modern system to ancient practice should be treated cautiously.\n\nEach frequency carries strong contemporary wellness associations: 396 Hz with letting go of worry; 417 Hz with change; 528 Hz with harmony and love; 639 Hz with interpersonal connection; 741 Hz with clarity; and 852 Hz with inner stillness.`,
    keyPoints: [
      'Six core Solfeggio tones: 396, 417, 528, 639, 741, 852 Hz',
      'Contemporary spiritual and wellness associations',
      'Historical claims should be treated cautiously',
      '528 Hz has small exploratory human evidence but no established DNA-repair effect',
    ],
    practicalTips: [
      'Start with 5–20 minutes at a comfortable volume',
      'Choose a time and environment that fits your routine',
      'Notice subjective relaxation rather than expecting predetermined outcomes',
      'Keep a quiet journal to track mindfulness shifts',
    ],
    historicalContext: 'Historical claims linking the complete modern Solfeggio system directly to ancient Gregorian practice should be treated cautiously.',
    scientificBasis: 'Preliminary studies exist for select tones (e.g. 528-Hz-tuned music), but therapeutic mechanisms remain unestablished.',
    icon: Music,
    color: '#F472B6',
    gradient: ['#F472B6', '#DB2777'],
  },
  {
    id: '2',
    title: 'Understanding Your Chakras Through Sound',
    category: 'chakras',
    readTime: 9,
    difficulty: 'Beginner',
    content: `The chakra system, originating from ancient Indian spiritual traditions, describes energy centers in the body. Modern sound-healing systems associate specific musical frequencies with individual chakras (Root 194.18 Hz to Crown 963 Hz).\n\nFrequency-to-chakra mappings vary across lineages and are not scientifically validated human anatomy. They provide a structured framework for meditation and visualization.`,
    keyPoints: [
      'Chakras are spiritual and contemplative concepts',
      'Root (194.18 Hz) to Crown (963 Hz) framework',
      'Mappings vary and are not scientifically validated anatomy',
      'Sequential meditation offers a calming routine',
    ],
    practicalTips: [
      'Treat chakra soundscapes as a reflective meditation framework',
      'Spend 5–15 minutes per frequency during meditation',
      'Visualize calm color themes associated with each focus area',
    ],
    historicalContext: 'Part of Hindu and Buddhist spiritual traditions for millennia.',
    icon: Zap,
    color: '#FBBF24',
    gradient: ['#FBBF24', '#D97706'],
  },
  {
    id: '3',
    title: 'Brainwave Entrainment: Science of the Synchronised Mind',
    category: 'brainwaves',
    readTime: 8,
    difficulty: 'Intermediate',
    content: `Binaural beats occur when two slightly different tones are presented separately to each ear through stereo headphones, creating a perceived phantom beat. Evidence for reliable brainwave entrainment remains mixed and study-dependent.`,
    keyPoints: [
      'Binaural beats require stereo headphones',
      'Five brainwave states: Delta, Theta, Alpha, Beta, Gamma',
      'Scientific evidence for entrainment remains mixed and non-deterministic',
      'Offers a helpful backdrop for meditation and focus',
    ],
    practicalTips: [
      'Always use stereo headphones for binaural beats',
      'Choose a comfortable session length (5–20 minutes)',
      'Never drive or operate machinery while listening',
    ],
    scientificBasis: 'Psychoacoustic phenomenon. Meta-analyses (Garcia-Argibay et al., 2019) report possible effects on anxiety and focus, though systematic reviews (Ingendoh et al., 2023) highlight mixed entrainment evidence.',
    icon: Brain,
    color: '#818CF8',
    gradient: ['#818CF8', '#6366F1'],
  },
  {
    id: '4',
    title: '528 Hz: The "Love Frequency" — What We Know and What We Don\'t',
    category: 'healing',
    readTime: 8,
    difficulty: 'Intermediate',
    content: `The 528 Hz frequency is widely associated with love and transformation. A small 2018 study observed reductions in cortisol after subjects listened to 528-Hz-tuned music. The study evaluated music rather than a pure tone, and sample size was small. Claims of DNA repair are unsupported.`,
    keyPoints: [
      '528 Hz is widely associated with love and transformation',
      'Small 2018 study (9 subjects) noted cortisol changes with 528-Hz-tuned music',
      'Tested music rather than an isolated pure tone',
      'Claims that 528 Hz repairs DNA are unsupported by clinical science',
    ],
    practicalTips: [
      'Use 528 Hz as a tranquil backdrop for heart-focused meditation',
      'Listen for 5–20 minutes at a comfortable volume',
      'Do not rely on audio tones for medical conditions',
    ],
    scientificBasis: 'Akimoto et al. (2018) reported endocrine changes in 9 subjects listening to 528-Hz music. DNA repair claims are unsupported.',
    icon: Heart,
    color: '#34D399',
    gradient: ['#34D399', '#059669'],
  },
  {
    id: '5',
    title: 'Sleep & Sound: Building a Restful Listening Routine',
    category: 'sleep',
    readTime: 7,
    difficulty: 'Beginner',
    content: `A 2022 Cochrane review found music may help some adults improve subjective sleep quality. Sleep cannot be reduced to one frequency. Delta and theta waves describe neural ranges during sleep, not guaranteed externally induced sleep stages.`,
    keyPoints: [
      'Music may help some adults improve subjective sleep quality',
      'Sleep cannot be reduced to one frequency',
      'Delta/theta describe neural ranges, not guaranteed sleep stage triggers',
      'A calm environment and comfortable volume matter',
    ],
    practicalTips: [
      'Begin your pre-sleep routine 30–45 minutes before bed',
      'Keep volume low and comfortable for resting',
      'Avoid bright screens while winding down',
    ],
    scientificBasis: 'Cochrane review (2022) indicates music may support subjective sleep quality.',
    icon: Moon,
    color: '#60A5FA',
    gradient: ['#60A5FA', '#3B82F6'],
  },
  {
    id: '6',
    title: 'Sound, Intention & Abundance: Using Music for Goal Reflection',
    category: 'manifestation',
    readTime: 8,
    difficulty: 'Intermediate',
    content: `Using audio frequencies for goal reflection combines numerological symbolism (888 Hz), alternative tuning (432 Hz), and alpha-range focus (10 Hz). Goal setting during audio sessions operates through cognitive priming. Sound does not supernatural attract wealth; concrete personal action creates success.`,
    keyPoints: [
      '888 Hz carries numerological symbolism for abundance reflection',
      '432 Hz is an alternative musical tuning used for calming focus',
      'Goal setting works through psychological focus and priming',
      'Concrete personal action creates success',
    ],
    practicalTips: [
      'Formulate clear personal goals before your listening session',
      'Journal concrete action steps immediately after listening',
      'Use 10 Hz Alpha or 432 Hz audio as a focus backdrop',
    ],
    icon: Sparkles,
    color: '#FBBF24',
    gradient: ['#FBBF24', '#D97706'],
  },
  {
    id: '7',
    title: "Schumann Resonance: Earth's Electromagnetic Phenomenon",
    category: 'science',
    readTime: 7,
    difficulty: 'Intermediate',
    content: `The Schumann Resonance is an atmospheric electromagnetic phenomenon near 7.83 Hz. Phone audio reproduces acoustic sound waves, not Earth's planetary electromagnetic fields. Schumann-inspired tracks offer a calming acoustic backdrop for grounding meditation.`,
    keyPoints: [
      'Earth has atmospheric electromagnetic resonances near 7.83 Hz',
      '7.83 Hz falls mathematically within the alpha-theta boundary',
      'Phone audio generates acoustic sound waves, not planetary fields',
      'Schumann-inspired audio offers a soothing backdrop for meditation',
    ],
    practicalTips: [
      'Use Schumann-inspired audio as a calm backdrop for meditation',
      'Listen at a comfortable, moderate volume',
      'Use for 5–20 minutes to settle a busy mind',
    ],
    scientificBasis: 'Schumann resonances are documented atmospheric electromagnetic phenomena near 7.83 Hz.',
    icon: Activity,
    color: '#22D3EE',
    gradient: ['#22D3EE', '#0891B2'],
  },
  {
    id: '8',
    title: '40 Hz Gamma Research: What Scientists Are Investigating',
    category: 'science',
    readTime: 9,
    difficulty: 'Advanced',
    content: `MIT researchers investigate 40 Hz sensory stimulation in Alzheimer's disease models. While promising, human clinical trials are preliminary and use specialized equipment. Playing a 40 Hz audio track through a commercial smartphone app is not a medical treatment for Alzheimer's disease.`,
    keyPoints: [
      '40 Hz falls in the gamma brainwave range associated with active cognition',
      'MIT studies investigate 40 Hz sensory stimulation in Alzheimer\'s models',
      'Human clinical trials are preliminary',
      'A consumer audio track is not an Alzheimer\'s medical treatment',
    ],
    practicalTips: [
      'Use 40 Hz audio as a focus backdrop during study or work',
      'Keep sessions to 15–20 minutes as gamma frequencies are activating',
      'Listen at a comfortable volume during waking hours',
    ],
    scientificBasis: 'Tsai et al. (MIT, 2016) demonstrated microglial and amyloid changes in mice using 40 Hz sensory stimulation. Human trials remain exploratory.',
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
  const params = useGlobalSearchParams<{ articleId?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, gradients, isDark } = useTheme();
  const { articles: rawArticles } = useLearningArticles();

  const articles = useMemo(() => {
    if (!rawArticles || rawArticles.length === 0) return STATIC_ARTICLES;
    const iconMap: Record<string, any> = {
      music: Music,
      zap: Zap,
      brain: Brain,
      heart: Heart,
      moon: Moon,
      sparkles: Sparkles,
      activity: Activity,
    };
    return rawArticles.map(a => ({
      ...a,
      icon: iconMap[a.iconIdentifier?.toLowerCase()] || BookOpen,
      color: a.colorToken || '#A78BFA',
      gradient: [a.colorToken || '#A78BFA', a.colorToken || '#7C3AED'],
    }));
  }, [rawArticles]);
  const styles = useMemo(() => createStyles(colors, gradients, isDark), [colors, gradients, isDark]);
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

  useEffect(() => {
    if (!params.articleId) return;
    const target = articles.find((article) => article.id === params.articleId);
    if (target) setSelectedArticle(target);
  }, [articles, params.articleId]);

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
    const recommended = getRecommendedArticles ? getRecommendedArticles(articles) : [];
    if (recommended?.length > 0) {
      setSelectedArticle(recommended[0]);
    } else {
      const unread = articles.filter(a => !progress?.readArticles?.includes(a.id));
      setSelectedArticle(unread.length > 0 ? unread[0] : articles[0]);
    }
  }, [getRecommendedArticles, progress?.readArticles]);

  useEffect(() => {
    if (selectedArticle) startReadingSession(selectedArticle.id);
  }, [selectedArticle]);

  useEffect(() => {
    if (searchQuery && filteredArticles.length > 0) addSearchToHistory(searchQuery, filteredArticles.length);
  }, [searchQuery]);

  const filteredArticles = articles.filter(a => {
    const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const stats = getReadingStats || { totalArticles: 0, currentStreak: 0, totalTime: 0, favoriteCount: 0 };
  const progressPct = Math.min(100, (stats.totalArticles / articles.length) * 100);

  const featuredArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
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
            <Text style={styles.headerReadingText}>{stats.totalArticles}/{articles.length}</Text>
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
              <Text style={styles.guideProgressText}>{stats.totalArticles} of {articles.length} completed</Text>
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
          <View style={[styles.modalWrap, { backgroundColor: colors.bg }]}>
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
                colors={isDark
                  ? ['rgba(10,14,26,0)', 'rgba(10,14,26,0.98)', colors.bg]
                  : ['rgba(245,246,250,0)', 'rgba(245,246,250,0.98)', colors.bg]}
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

const createStyles = (colors: any, gradients: any, isDark: boolean) => StyleSheet.create({
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
    backgroundColor: isDark ? colors.glassStrong : 'rgba(255,255,255,0.2)',
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
  modalWrap: { flex: 1, backgroundColor: colors.bg },
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
