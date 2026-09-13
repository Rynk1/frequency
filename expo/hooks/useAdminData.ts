import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { authService } from '@/lib/firebase-auth';
import { useDataMode } from './useDataMode';
import { getFrequenciesSeed } from '@/seed/frequencies';
import { getProgramsSeed } from '@/seed/programs';
import { getArticlesSeed } from '@/seed/articles';

export interface Frequency {
  id: string;
  name: string;
  hz: number;
  frequency: string;
  description: string;
  category: string;
  color?: string;
  gradient?: string[];
  benefits: string[];
  isPremium: boolean;
  tags: string[];
  scientificBasis?: string;
  usageGuidelines?: string;
  duration?: string;
  research?: string;
  status?: 'published' | 'draft' | 'archived';
}

export interface CuratedProgram {
  id: string;
  name: string;
  description: string;
  frequencies: string[];
  duration: number;
  category: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'published' | 'draft' | 'archived';
}

export interface LearningArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  publishedAt: string;
  author: string;
  status?: 'published' | 'draft' | 'archived';
}

interface AdminDataState {
  frequencies: Frequency[];
  curatedPrograms: CuratedProgram[];
  articles: LearningArticle[];
  isLoading: boolean;
  isCloudAvailable: boolean;
  addFrequency: (frequency: Omit<Frequency, 'id'>) => Promise<void>;
  updateFrequency: (id: string, frequency: Partial<Frequency>) => Promise<void>;
  deleteFrequency: (id: string) => Promise<void>;
  addCuratedProgram: (program: Omit<CuratedProgram, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCuratedProgram: (id: string, program: Partial<CuratedProgram>) => Promise<void>;
  deleteCuratedProgram: (id: string) => Promise<void>;
  addArticle: (article: Omit<LearningArticle, 'id' | 'publishedAt'>) => Promise<void>;
  updateArticle: (id: string, article: Partial<LearningArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  syncData: () => Promise<void>;
}

const STORAGE_KEYS = {
  frequencies: 'adminFrequencies',
  curatedPrograms: 'adminCuratedPrograms',
  articles: 'adminArticles',
} as const;

export const [AdminDataProvider, useAdminData] = createContextHook<AdminDataState>(() => {
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [curatedPrograms, setCuratedPrograms] = useState<CuratedProgram[]>([]);
  const [articles, setArticles] = useState<LearningArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudAvailable, setIsCloudAvailable] = useState<boolean>(true);
  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();

  const loadLocalFallback = useCallback(async () => {
    const storedFrequencies = await AsyncStorage.getItem(STORAGE_KEYS.frequencies);
    if (storedFrequencies) {
      setFrequencies(JSON.parse(storedFrequencies));
    } else {
      const defaultFrequencies = getFrequenciesSeed() as any;
      setFrequencies(defaultFrequencies);
      await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(defaultFrequencies));
    }

    const storedPrograms = await AsyncStorage.getItem(STORAGE_KEYS.curatedPrograms);
    if (storedPrograms) {
      setCuratedPrograms(JSON.parse(storedPrograms));
    } else {
      const defaultPrograms = getProgramsSeed() as any;
      setCuratedPrograms(defaultPrograms);
      await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(defaultPrograms));
    }

    const storedArticles = await AsyncStorage.getItem(STORAGE_KEYS.articles);
    if (storedArticles) {
      setArticles(JSON.parse(storedArticles));
    } else {
      const defaultArticles = getArticlesSeed() as any;
      setArticles(defaultArticles);
      await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(defaultArticles));
    }
  }, []);

  const seedFrequenciesIfEmpty = useCallback(async () => {
    const seededFrequencies = getFrequenciesSeed() as any;
    const currentUser = auth.currentUser;
    const isAdminUser = await authService.isAdmin(currentUser, false);

    if (!isAdminUser) {
      // Non-admin user cannot write to /frequencies; use canonical defaults without seeding error
      return seededFrequencies;
    }

    try {
      const batch = writeBatch(db);
      const frequenciesRef = collection(db, 'frequencies');
      seededFrequencies.forEach((frequency: any) => {
        batch.set(doc(frequenciesRef, frequency.id), frequency);
      });
      await batch.commit();
      console.log('✅ Firestore seeded with canonical frequencies (admin)');
    } catch {
      // Fallback gracefully
    }
    return seededFrequencies;
  }, []);

  const seedProgramsIfEmpty = useCallback(async () => {
    const seededPrograms = getProgramsSeed() as any;
    const currentUser = auth.currentUser;
    const isAdminUser = await authService.isAdmin(currentUser, false);

    if (!isAdminUser) {
      return seededPrograms;
    }

    try {
      const batch = writeBatch(db);
      const curatedProgramsRef = collection(db, 'curatedPrograms');
      seededPrograms.forEach((program: any) => {
        batch.set(doc(curatedProgramsRef, program.id), program);
      });
      await batch.commit();
      console.log('✅ Firestore seeded with canonical programs (admin)');
    } catch {
      // Fallback gracefully
    }
    return seededPrograms;
  }, []);

  const seedArticlesIfEmpty = useCallback(async () => {
    const seededArticles = getArticlesSeed() as any;
    const currentUser = auth.currentUser;
    const isAdminUser = await authService.isAdmin(currentUser, false);

    if (!isAdminUser) {
      return seededArticles;
    }

    try {
      const batch = writeBatch(db);
      const articlesRef = collection(db, 'articles');
      seededArticles.forEach((article: any) => {
        batch.set(doc(articlesRef, article.id), article);
      });
      await batch.commit();
      console.log('✅ Firestore seeded with canonical articles (admin)');
    } catch {
      // Fallback gracefully
    }
    return seededArticles;
  }, []);

  const loadFromFirestore = useCallback(async () => {
    const frequenciesRef = collection(db, 'frequencies');
    const curatedProgramsRef = collection(db, 'curatedPrograms');
    const articlesRef = collection(db, 'articles');

    const [frequencySnapshot, programSnapshot, articleSnapshot] = await Promise.all([
      getDocs(frequenciesRef),
      getDocs(curatedProgramsRef),
      getDocs(articlesRef),
    ]);

    let loadedFrequencies: Frequency[];
    if (frequencySnapshot.empty) {
      loadedFrequencies = await seedFrequenciesIfEmpty();
    } else {
      loadedFrequencies = frequencySnapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Frequency),
        id: docSnap.id,
      }));
    }

    let loadedPrograms: CuratedProgram[];
    if (programSnapshot.empty) {
      loadedPrograms = await seedProgramsIfEmpty();
    } else {
      loadedPrograms = programSnapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as CuratedProgram),
        id: docSnap.id,
      }));
    }

    let loadedArticles: LearningArticle[];
    if (articleSnapshot.empty) {
      loadedArticles = await seedArticlesIfEmpty();
    } else {
      loadedArticles = articleSnapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as LearningArticle),
        id: docSnap.id,
      }));
    }

    return {
      frequencies: loadedFrequencies,
      curatedPrograms: loadedPrograms,
      articles: loadedArticles,
    };
  }, [seedFrequenciesIfEmpty, seedProgramsIfEmpty, seedArticlesIfEmpty]);

  const loadData = useCallback(async () => {
    // Explicit local mode
    if (!shouldUseFirestore) {
      setIsLoading(true);
      setIsCloudAvailable(false);
      await loadLocalFallback();
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const remote = await loadFromFirestore();
      setFrequencies(remote.frequencies);
      setCuratedPrograms(remote.curatedPrograms);
      setArticles(remote.articles);
      setIsCloudAvailable(true);
      await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(remote.frequencies));
      await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(remote.curatedPrograms));
      await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(remote.articles));
    } catch (error: any) {
      setIsCloudAvailable(false);
      const msg = error?.code === 'permission-denied'
        ? 'Firestore permissions denied — deploy firestore.rules first'
        : `Admin Firestore fetch failed: ${error?.message || error}`;
      setCloudError(msg);

      if (isCloudStrict) {
        console.error('❌ Cloud mode error: ' + msg);
        setIsLoading(false);
        throw error;
      }
      console.warn('⚠️ Firestore fetch failed in Auto mode:', msg);
      await loadLocalFallback();
    } finally {
      setIsLoading(false);
    }
  }, [loadFromFirestore, loadLocalFallback, shouldUseFirestore, isCloudStrict, setCloudError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const syncData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const mutateWithFirestore = useCallback(async (
    operation: () => Promise<void>,
    label: string
  ) => {
    if (!shouldUseFirestore) return;
    try {
      await operation();
    } catch (error: any) {
      if (isCloudStrict) {
        const msg = `Admin Firestore ${label} failed: ${error?.message || error}`;
        setCloudError(msg);
        console.error('❌ Cloud mode: ' + msg);
        throw error;
      }
      console.error(`❌ ${label} Firestore failed (auto mode, continuing locally):`, error);
    }
  }, [shouldUseFirestore, isCloudStrict, setCloudError]);

  const addFrequency = useCallback(async (frequency: Omit<Frequency, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const newFrequency: Frequency = { status: 'published', ...frequency, id };
    await mutateWithFirestore(
      () => setDoc(doc(collection(db, 'frequencies'), id), newFrequency),
      'addFrequency'
    );
    const updated = [...frequencies, newFrequency];
    setFrequencies(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(updated));
  }, [frequencies, mutateWithFirestore]);

  const updateFrequency = useCallback(async (id: string, frequency: Partial<Frequency>) => {
    await mutateWithFirestore(
      () => updateDoc(doc(collection(db, 'frequencies'), id), frequency),
      'updateFrequency'
    );
    const updated = frequencies.map((item) => (item.id === id ? { ...item, ...frequency } : item));
    setFrequencies(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(updated));
  }, [frequencies, mutateWithFirestore]);

  const deleteFrequency = useCallback(async (id: string) => {
    await mutateWithFirestore(
      () => deleteDoc(doc(collection(db, 'frequencies'), id)),
      'deleteFrequency'
    );
    const updated = frequencies.filter((item) => item.id !== id);
    setFrequencies(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(updated));
  }, [frequencies, mutateWithFirestore]);

  const addCuratedProgram = useCallback(async (program: Omit<CuratedProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `program-${Date.now()}`;
    const newProgram: CuratedProgram = {
      status: 'published',
      ...program,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await mutateWithFirestore(
      () => setDoc(doc(collection(db, 'curatedPrograms'), id), newProgram),
      'addCuratedProgram'
    );
    const updated = [...curatedPrograms, newProgram];
    setCuratedPrograms(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(updated));
  }, [curatedPrograms, mutateWithFirestore]);

  const updateCuratedProgram = useCallback(async (id: string, program: Partial<CuratedProgram>) => {
    await mutateWithFirestore(
      () => updateDoc(doc(collection(db, 'curatedPrograms'), id), { ...program, updatedAt: new Date().toISOString() }),
      'updateCuratedProgram'
    );
    const updated = curatedPrograms.map((item) =>
      item.id === id ? { ...item, ...program, updatedAt: new Date().toISOString() } : item
    );
    setCuratedPrograms(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(updated));
  }, [curatedPrograms, mutateWithFirestore]);

  const deleteCuratedProgram = useCallback(async (id: string) => {
    await mutateWithFirestore(
      () => deleteDoc(doc(collection(db, 'curatedPrograms'), id)),
      'deleteCuratedProgram'
    );
    const updated = curatedPrograms.filter((item) => item.id !== id);
    setCuratedPrograms(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(updated));
  }, [curatedPrograms, mutateWithFirestore]);

  const addArticle = useCallback(async (article: Omit<LearningArticle, 'id' | 'publishedAt'>) => {
    const id = `article-${Date.now()}`;
    const newArticle: LearningArticle = {
      status: 'published',
      ...article,
      id,
      publishedAt: new Date().toISOString(),
    };
    await mutateWithFirestore(
      () => setDoc(doc(collection(db, 'articles'), id), newArticle),
      'addArticle'
    );
    const updated = [...articles, newArticle];
    setArticles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(updated));
  }, [articles, mutateWithFirestore]);

  const updateArticle = useCallback(async (id: string, article: Partial<LearningArticle>) => {
    await mutateWithFirestore(
      () => updateDoc(doc(collection(db, 'articles'), id), article),
      'updateArticle'
    );
    const updated = articles.map((item) => (item.id === id ? { ...item, ...article } : item));
    setArticles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(updated));
  }, [articles, mutateWithFirestore]);

  const deleteArticle = useCallback(async (id: string) => {
    await mutateWithFirestore(
      () => deleteDoc(doc(collection(db, 'articles'), id)),
      'deleteArticle'
    );
    const updated = articles.filter((item) => item.id !== id);
    setArticles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(updated));
  }, [articles, mutateWithFirestore]);

  return useMemo(() => ({
    frequencies,
    curatedPrograms,
    articles,
    isLoading,
    isCloudAvailable,
    addFrequency,
    updateFrequency,
    deleteFrequency,
    addCuratedProgram,
    updateCuratedProgram,
    deleteCuratedProgram,
    addArticle,
    updateArticle,
    deleteArticle,
    syncData,
  }), [
    frequencies,
    curatedPrograms,
    articles,
    isLoading,
    isCloudAvailable,
    addFrequency,
    updateFrequency,
    deleteFrequency,
    addCuratedProgram,
    updateCuratedProgram,
    deleteCuratedProgram,
    addArticle,
    updateArticle,
    deleteArticle,
    syncData,
  ]);
});
