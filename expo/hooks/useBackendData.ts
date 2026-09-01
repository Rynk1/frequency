import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDataMode } from './useDataMode';
import { CanonicalFrequency, CanonicalArticle, ContentStatus } from '@/types/content';
import { getFrequenciesSeed } from '@/seed/frequencies';
import { getArticlesSeed } from '@/seed/articles';
import { getProgramsSeed } from '@/seed/programs';

export type Frequency = CanonicalFrequency;

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
}

export type LearningArticle = CanonicalArticle;

interface BackendDataState {
  frequencies: Frequency[];
  curatedPrograms: CuratedProgram[];
  articles: LearningArticle[];
  isLoading: boolean;
  addFrequency: (frequency: Omit<Frequency, 'id' | 'createdAt' | 'updatedAt' | 'provenance' | 'seedVersion'>) => Promise<void>;
  updateFrequency: (id: string, frequency: Partial<Frequency>) => Promise<void>;
  deleteFrequency: (id: string) => Promise<void>;
  addCuratedProgram: (program: Omit<CuratedProgram, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCuratedProgram: (id: string, program: Partial<CuratedProgram>) => Promise<void>;
  deleteCuratedProgram: (id: string) => Promise<void>;
  addArticle: (article: Omit<LearningArticle, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'provenance' | 'seedVersion'>) => Promise<void>;
  updateArticle: (id: string, article: Partial<LearningArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  syncData: () => Promise<void>;
}

const STORAGE_KEYS = {
  frequencies: 'localFrequencies',
  curatedPrograms: 'localCuratedPrograms',
  articles: 'localArticles',
} as const;

export const [BackendDataProvider, useBackendData] = createContextHook<BackendDataState>(() => {
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [curatedPrograms, setCuratedPrograms] = useState<CuratedProgram[]>([]);
  const [articles, setArticles] = useState<LearningArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();

  const frequenciesRef = collection(db, 'frequencies');
  const curatedProgramsRef = collection(db, 'curatedPrograms');
  const articlesRef = collection(db, 'articles');

  /** Tier 3 Fallback: Version-controlled repository seed */
  const loadLocalFallback = useCallback(async () => {
    const seedFrequencies = getFrequenciesSeed();
    const seedArticles = getArticlesSeed();
    const seedPrograms = getProgramsSeed();

    const storedFrequencies = await AsyncStorage.getItem(STORAGE_KEYS.frequencies);
    if (storedFrequencies) {
      setFrequencies(JSON.parse(storedFrequencies));
    } else {
      setFrequencies(seedFrequencies);
      await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(seedFrequencies));
    }

    const storedPrograms = await AsyncStorage.getItem(STORAGE_KEYS.curatedPrograms);
    if (storedPrograms) {
      setCuratedPrograms(JSON.parse(storedPrograms));
    } else {
      setCuratedPrograms(seedPrograms as any);
      await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(seedPrograms));
    }

    const storedArticles = await AsyncStorage.getItem(STORAGE_KEYS.articles);
    if (storedArticles) {
      setArticles(JSON.parse(storedArticles));
    } else {
      setArticles(seedArticles);
      await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(seedArticles));
    }
  }, []);

  /** Tier 1: Cloud Firestore Authoritative Live Source */
  const loadFromFirestore = useCallback(async () => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore fetch timed out after 10s')), 10000)
    );

    const [frequencySnapshot, programSnapshot, articleSnapshot] = await Promise.race([
      Promise.all([
        getDocs(frequenciesRef),
        getDocs(curatedProgramsRef),
        getDocs(articlesRef),
      ]),
      timeoutPromise,
    ]);

    const loadedFrequencies = frequencySnapshot.empty
      ? getFrequenciesSeed()
      : frequencySnapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Frequency),
          id: docSnap.id,
        }));

    const loadedPrograms = programSnapshot.empty
      ? (getProgramsSeed() as any)
      : programSnapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as CuratedProgram),
          id: docSnap.id,
        }));

    const loadedArticles = articleSnapshot.empty
      ? getArticlesSeed()
      : articleSnapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as LearningArticle),
          id: docSnap.id,
        }));

    return {
      frequencies: loadedFrequencies,
      curatedPrograms: loadedPrograms,
      articles: loadedArticles,
    };
  }, [articlesRef, frequenciesRef, curatedProgramsRef]);

  const loadData = useCallback(async () => {
    if (!shouldUseFirestore) {
      await loadLocalFallback();
      setIsLoading(false);
      return;
    }

    try {
      const remote = await loadFromFirestore();
      setFrequencies(remote.frequencies);
      setCuratedPrograms(remote.curatedPrograms);
      setArticles(remote.articles);

      // Async Cache to Tier 2 (AsyncStorage)
      AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(remote.frequencies)).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(remote.curatedPrograms)).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(remote.articles)).catch(() => {});
    } catch (error: any) {
      if (isCloudStrict) {
        const msg = error?.code === 'permission-denied'
          ? 'Firestore permissions denied — deploy firestore.rules first'
          : `Firestore fetch failed: ${error?.message || error}`;
        setCloudError(msg);
        console.error('❌ Cloud mode: ' + msg);
        setIsLoading(false);
        throw error;
      }
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
        const msg = `Firestore ${label} failed: ${error?.message || error}`;
        setCloudError(msg);
        console.error('❌ Cloud mode: ' + msg);
        throw error;
      }
      console.error(`❌ ${label} Firestore failed (auto mode, continuing locally):`, error);
    }
  }, [shouldUseFirestore, isCloudStrict, setCloudError]);

  const addFrequency = useCallback(async (frequency: Omit<Frequency, 'id' | 'createdAt' | 'updatedAt' | 'provenance' | 'seedVersion'>) => {
    const id = `custom-${Date.now()}`;
    const now = new Date().toISOString();
    const newFrequency: Frequency = {
      ...frequency,
      id,
      provenance: 'admin',
      seedVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'admin',
      updatedBy: 'admin',
    } as Frequency;

    await mutateWithFirestore(
      () => setDoc(doc(frequenciesRef, id), newFrequency),
      'addFrequency'
    );
    const updated = [...frequencies, newFrequency];
    setFrequencies(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(updated));
  }, [frequencies, frequenciesRef, mutateWithFirestore]);

  const updateFrequency = useCallback(async (id: string, frequency: Partial<Frequency>) => {
    const now = new Date().toISOString();
    const updates = {
      ...frequency,
      provenance: 'admin' as const,
      updatedAt: now,
      updatedBy: 'admin',
    };

    await mutateWithFirestore(
      () => updateDoc(doc(frequenciesRef, id), updates),
      'updateFrequency'
    );
    const updated = frequencies.map((item) => (item.id === id ? { ...item, ...updates } : item));
    setFrequencies(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(updated));
  }, [frequencies, frequenciesRef, mutateWithFirestore]);

  const deleteFrequency = useCallback(async (id: string) => {
    await mutateWithFirestore(
      () => deleteDoc(doc(frequenciesRef, id)),
      'deleteFrequency'
    );
    const updated = frequencies.filter((item) => item.id !== id);
    setFrequencies(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(updated));
  }, [frequencies, frequenciesRef, mutateWithFirestore]);

  const addCuratedProgram = useCallback(async (program: Omit<CuratedProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `program-${Date.now()}`;
    const now = new Date().toISOString();
    const newProgram: CuratedProgram = {
      ...program,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await mutateWithFirestore(
      () => setDoc(doc(curatedProgramsRef, id), newProgram),
      'addCuratedProgram'
    );
    const updated = [...curatedPrograms, newProgram];
    setCuratedPrograms(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(updated));
  }, [curatedPrograms, curatedProgramsRef, mutateWithFirestore]);

  const updateCuratedProgram = useCallback(async (id: string, program: Partial<CuratedProgram>) => {
    const now = new Date().toISOString();
    await mutateWithFirestore(
      () => updateDoc(doc(curatedProgramsRef, id), { ...program, updatedAt: now }),
      'updateCuratedProgram'
    );
    const updated = curatedPrograms.map((item) =>
      item.id === id ? { ...item, ...program, updatedAt: now } : item
    );
    setCuratedPrograms(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(updated));
  }, [curatedPrograms, curatedProgramsRef, mutateWithFirestore]);

  const deleteCuratedProgram = useCallback(async (id: string) => {
    await mutateWithFirestore(
      () => deleteDoc(doc(curatedProgramsRef, id)),
      'deleteCuratedProgram'
    );
    const updated = curatedPrograms.filter((item) => item.id !== id);
    setCuratedPrograms(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(updated));
  }, [curatedPrograms, curatedProgramsRef, mutateWithFirestore]);

  const addArticle = useCallback(async (article: Omit<LearningArticle, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'provenance' | 'seedVersion'>) => {
    const id = `article-${Date.now()}`;
    const now = new Date().toISOString();
    const newArticle: LearningArticle = {
      ...article,
      id,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      provenance: 'admin',
      seedVersion: 1,
      createdBy: 'admin',
      updatedBy: 'admin',
    } as LearningArticle;

    await mutateWithFirestore(
      () => setDoc(doc(articlesRef, id), newArticle),
      'addArticle'
    );
    const updated = [...articles, newArticle];
    setArticles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(updated));
  }, [articles, articlesRef, mutateWithFirestore]);

  const updateArticle = useCallback(async (id: string, article: Partial<LearningArticle>) => {
    const now = new Date().toISOString();
    const updates = {
      ...article,
      provenance: 'admin' as const,
      updatedAt: now,
      updatedBy: 'admin',
    };

    await mutateWithFirestore(
      () => updateDoc(doc(articlesRef, id), updates),
      'updateArticle'
    );
    const updated = articles.map((item) => (item.id === id ? { ...item, ...article } : item));
    setArticles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(updated));
  }, [articles, articlesRef, mutateWithFirestore]);

  const deleteArticle = useCallback(async (id: string) => {
    await mutateWithFirestore(
      () => deleteDoc(doc(articlesRef, id)),
      'deleteArticle'
    );
    const updated = articles.filter((item) => item.id !== id);
    setArticles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(updated));
  }, [articles, articlesRef, mutateWithFirestore]);

  return useMemo(() => ({
    frequencies,
    curatedPrograms,
    articles,
    isLoading,
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
