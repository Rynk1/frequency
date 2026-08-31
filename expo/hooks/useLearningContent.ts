import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useDataMode } from './useDataMode';

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
  lastReadDate?: string;
  readProgress?: number;
  notes?: string;
}

interface LearningProgress {
  totalArticlesRead: number;
  totalReadingTime: number;
  favoriteArticles: string[];
  readArticles: string[];
  articleNotes: Record<string, string>;
  categoryProgress: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  lastReadDate?: string;
}

interface SearchHistory {
  query: string;
  timestamp: string;
  resultsCount: number;
}

const STORAGE_KEYS = {
  LEARNING_PROGRESS: 'learningProgress',
  SEARCH_HISTORY: 'searchHistory',
  ARTICLE_BOOKMARKS: 'articleBookmarks',
  READING_SESSIONS: 'readingSessions',
};

/** Get user-scoped Firestore doc path for learning progress */
const getLearningDoc = (userId: string) => {
  if (!userId) return null;
  return doc(db, 'userLearning', userId);
};

export const [LearningContentProvider, useLearningContent] = createContextHook(() => {
  const { user } = useAuth();
  const userId = user?.uid || '';
  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();

  const [progress, setProgress] = useState<LearningProgress>({
    totalArticlesRead: 0,
    totalReadingTime: 0,
    favoriteArticles: [],
    readArticles: [],
    articleNotes: {},
    categoryProgress: {},
    currentStreak: 0,
    longestStreak: 0,
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentReadingSession, setCurrentReadingSession] = useState<{
    articleId: string;
    startTime: number;
    pausedTime: number;
  } | null>(null);

  // ── Load from Firestore (primary) with AsyncStorage fallback ──
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Try Firestore first if we have a user and cloud mode
      if (userId && shouldUseFirestore) {
        try {
          const learningRef = getLearningDoc(userId);
          if (!learningRef) return;

          const firestoreTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Learning firestore fetch timed out')), 8000)
          );

          const snapshot = await Promise.race([
            getDoc(learningRef),
            firestoreTimeout,
          ]);

          if (snapshot.exists()) {
            const data = snapshot.data() as LearningProgress;
            const merged: LearningProgress = {
              totalArticlesRead: data.totalArticlesRead || 0,
              totalReadingTime: data.totalReadingTime || 0,
              favoriteArticles: data.favoriteArticles || [],
              readArticles: data.readArticles || [],
              articleNotes: data.articleNotes || {},
              categoryProgress: data.categoryProgress || {},
              currentStreak: data.currentStreak || 0,
              longestStreak: data.longestStreak || 0,
              lastReadDate: data.lastReadDate,
            };
            setProgress(merged);
            await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_PROGRESS, JSON.stringify(merged));
          } else {
            // Fall back to AsyncStorage
            const localProgress = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_PROGRESS);
            if (localProgress) setProgress(JSON.parse(localProgress));
          }
        } catch (firestoreError: any) {
          if (isCloudStrict) {
            const msg = firestoreError?.code === 'permission-denied'
              ? 'Firestore permissions denied for learning data — deploy firestore.rules'
              : `Firestore learning data load failed: ${firestoreError?.message || firestoreError}`;
            setCloudError(msg);
            console.error('❌ Cloud mode: ' + msg);
          } else {
            console.warn('Firestore learning load failed, using local cache:', firestoreError);
          }
          await loadLocalOnly();
        }
      } else {
        // No user OR local mode — load from AsyncStorage only
        await loadLocalOnly();
      }

      // Search history is always local
      const historyData = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      if (historyData) setSearchHistory(JSON.parse(historyData));
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, shouldUseFirestore, isCloudStrict, setCloudError]);

  const loadLocalOnly = async () => {
    const progressData = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_PROGRESS);
    if (progressData) setProgress(JSON.parse(progressData));
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ── Firestore sync helper ──
  const syncToFirestore = useCallback(async (updatedProgress: LearningProgress) => {
    if (!userId || !shouldUseFirestore) return;
    try {
      const learningRef = getLearningDoc(userId);
      if (!learningRef) return;
      await setDoc(learningRef, updatedProgress, { merge: true });
    } catch (error: any) {
      if (isCloudStrict) {
        setCloudError(`Failed to sync learning data: ${error?.message || error}`);
      }
      // Non-fatal — local cache is authoritative
    }
  }, [userId, shouldUseFirestore, isCloudStrict, setCloudError]);

  const saveData = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const markArticleAsRead = useCallback(async (articleId: string, readTime: number) => {
    const updatedProgress: LearningProgress = {
      ...progress,
      readArticles: progress.readArticles.includes(articleId)
        ? progress.readArticles
        : [...progress.readArticles, articleId],
      totalArticlesRead: progress.readArticles.includes(articleId)
        ? progress.totalArticlesRead
        : progress.totalArticlesRead + 1,
      totalReadingTime: progress.totalReadingTime + readTime,
      lastReadDate: new Date().toISOString(),
    };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastDate = updatedProgress.lastReadDate?.split('T')[0];

    if (lastDate === yesterday) {
      updatedProgress.currentStreak += 1;
    } else if (lastDate !== today) {
      updatedProgress.currentStreak = 1;
    }

    updatedProgress.longestStreak = Math.max(
      updatedProgress.currentStreak,
      updatedProgress.longestStreak
    );

    setProgress(updatedProgress);
    await saveData(STORAGE_KEYS.LEARNING_PROGRESS, updatedProgress);
    await syncToFirestore(updatedProgress);
  }, [progress, syncToFirestore]);

  const toggleFavorite = useCallback(async (articleId: string) => {
    const updatedProgress: LearningProgress = { ...progress };
    const index = updatedProgress.favoriteArticles.indexOf(articleId);

    if (index > -1) {
      updatedProgress.favoriteArticles.splice(index, 1);
    } else {
      updatedProgress.favoriteArticles.push(articleId);
    }

    setProgress(updatedProgress);
    await saveData(STORAGE_KEYS.LEARNING_PROGRESS, updatedProgress);
    await syncToFirestore(updatedProgress);
  }, [progress, syncToFirestore]);

  const saveArticleNote = useCallback(async (articleId: string, note: string) => {
    const updatedProgress: LearningProgress = {
      ...progress,
      articleNotes: {
        ...progress.articleNotes,
        [articleId]: note,
      },
    };

    setProgress(updatedProgress);
    await saveData(STORAGE_KEYS.LEARNING_PROGRESS, updatedProgress);
    await syncToFirestore(updatedProgress);
  }, [progress, syncToFirestore]);

  const addSearchToHistory = useCallback(async (query: string, resultsCount: number) => {
    if (!query.trim()) return;

    const newSearch: SearchHistory = {
      query: query.trim(),
      timestamp: new Date().toISOString(),
      resultsCount,
    };

    const updatedHistory = [newSearch, ...searchHistory.slice(0, 19)];
    setSearchHistory(updatedHistory);
    await saveData(STORAGE_KEYS.SEARCH_HISTORY, updatedHistory);
  }, [searchHistory]);

  const clearSearchHistory = useCallback(async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  }, []);

  const startReadingSession = useCallback((articleId: string) => {
    setCurrentReadingSession({
      articleId,
      startTime: Date.now(),
      pausedTime: 0,
    });
  }, []);

  const pauseReadingSession = useCallback(() => {
    if (currentReadingSession) {
      setCurrentReadingSession({
        ...currentReadingSession,
        pausedTime: Date.now(),
      });
    }
  }, [currentReadingSession]);

  const resumeReadingSession = useCallback(() => {
    if (currentReadingSession && currentReadingSession.pausedTime > 0) {
      const pauseDuration = Date.now() - currentReadingSession.pausedTime;
      setCurrentReadingSession({
        ...currentReadingSession,
        startTime: currentReadingSession.startTime + pauseDuration,
        pausedTime: 0,
      });
    }
  }, [currentReadingSession]);

  const endReadingSession = useCallback(async () => {
    if (currentReadingSession) {
      const readTime = Math.floor((Date.now() - currentReadingSession.startTime) / 60000);
      await markArticleAsRead(currentReadingSession.articleId, readTime);
      setCurrentReadingSession(null);
    }
  }, [currentReadingSession, markArticleAsRead]);

  const updateCategoryProgress = useCallback(async (category: string, progressValue: number) => {
    const updatedProgress: LearningProgress = {
      ...progress,
      categoryProgress: {
        ...progress.categoryProgress,
        [category]: progressValue,
      },
    };

    setProgress(updatedProgress);
    await saveData(STORAGE_KEYS.LEARNING_PROGRESS, updatedProgress);
    await syncToFirestore(updatedProgress);
  }, [progress, syncToFirestore]);

  const getRecommendedArticles = useCallback((articles: Article[]) => {
    const unreadArticles = articles.filter(a => !progress.readArticles.includes(a.id));

    const beginnerArticles = unreadArticles.filter(a => a.difficulty === 'Beginner');
    const intermediateArticles = unreadArticles.filter(a => a.difficulty === 'Intermediate');
    const advancedArticles = unreadArticles.filter(a => a.difficulty === 'Advanced');

    const recommendations: Article[] = [];

    if (progress.totalArticlesRead < 3) {
      recommendations.push(...beginnerArticles.slice(0, 3));
    } else if (progress.totalArticlesRead < 10) {
      recommendations.push(...beginnerArticles.slice(0, 1));
      recommendations.push(...intermediateArticles.slice(0, 2));
    } else {
      recommendations.push(...intermediateArticles.slice(0, 1));
      recommendations.push(...advancedArticles.slice(0, 2));
    }

    return recommendations;
  }, [progress]);

  const getReadingStats = useMemo(() => ({
    totalArticles: progress.totalArticlesRead,
    totalTime: progress.totalReadingTime,
    averageTime: progress.totalArticlesRead > 0
      ? Math.round(progress.totalReadingTime / progress.totalArticlesRead)
      : 0,
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    favoriteCount: progress.favoriteArticles.length,
  }), [progress]);

  const getPopularSearches = useMemo(() => {
    const searchCounts: Record<string, number> = {};
    searchHistory.forEach(search => {
      const key = search.query.toLowerCase();
      searchCounts[key] = (searchCounts[key] || 0) + 1;
    });

    return Object.entries(searchCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([query]) => query);
  }, [searchHistory]);

  return useMemo(() => ({
    progress,
    searchHistory,
    isLoading,
    currentReadingSession,
    markArticleAsRead,
    toggleFavorite,
    saveArticleNote,
    addSearchToHistory,
    clearSearchHistory,
    startReadingSession,
    pauseReadingSession,
    resumeReadingSession,
    endReadingSession,
    updateCategoryProgress,
    getRecommendedArticles,
    getReadingStats,
    getPopularSearches,
  }), [
    progress,
    searchHistory,
    isLoading,
    currentReadingSession,
    markArticleAsRead,
    toggleFavorite,
    saveArticleNote,
    addSearchToHistory,
    clearSearchHistory,
    startReadingSession,
    pauseReadingSession,
    resumeReadingSession,
    endReadingSession,
    updateCategoryProgress,
    getRecommendedArticles,
    getReadingStats,
    getPopularSearches,
  ]);
});
