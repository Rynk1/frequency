import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDataMode } from './useDataMode';
import {
  SOLFEGGIO_FREQUENCIES,
  CHAKRA_FREQUENCIES,
  BINAURAL_BEATS,
  HEALING_FREQUENCIES,
  SLEEP_FREQUENCIES,
  WEALTH_FREQUENCIES,
  SCIENTIFIC_FREQUENCIES,
} from '@/constants/frequencies';

export interface Frequency {
  id: string;
  name: string;
  hz: number;
  frequency: string;
  description: string;
  category: string;
  color?: string;
  gradient?: [string, string];
  benefits: string[];
  isPremium: boolean;
  tags: string[];
  scientificBasis?: string;
  usageGuidelines?: string;
  duration?: string;
  research?: string;
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
  readTime?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  keyPoints?: string[];
  practicalTips?: string[];
  scientificBasis?: string;
  historicalContext?: string;
}

interface BackendDataState {
  frequencies: Frequency[];
  curatedPrograms: CuratedProgram[];
  articles: LearningArticle[];
  isLoading: boolean;
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
  frequencies: 'localFrequencies',
  curatedPrograms: 'localCuratedPrograms',
  articles: 'localArticles',
} as const;

const createFrequencyId = (category: string, hz: number) => `${category}-${hz}`;

/** Single canonical source for frequency defaults — derived from constants/frequencies.ts */
const convertFrequencies = (): Frequency[] => {
  const frequencies: Frequency[] = [];

  const addFrequencies = (list: any[], category: string) => {
    list.forEach((freq) => {
      frequencies.push({
        id: createFrequencyId(category, freq.hz),
        name: freq.name,
        hz: freq.hz,
        frequency: `${freq.hz} Hz`,
        description: freq.description,
        category,
        color: freq.color || freq.gradient?.[0],
        gradient: freq.gradient,
        benefits: freq.benefits || [],
        isPremium: false,
        tags: [],
        duration: freq.duration,
        research: freq.research,
      });
    });
  };

  addFrequencies(SOLFEGGIO_FREQUENCIES, 'solfeggio');
  addFrequencies(CHAKRA_FREQUENCIES, 'chakra');
  addFrequencies(BINAURAL_BEATS, 'brainwave');
  addFrequencies(HEALING_FREQUENCIES, 'healing');
  addFrequencies(SLEEP_FREQUENCIES, 'sleep');
  addFrequencies(WEALTH_FREQUENCIES, 'manifestation');
  addFrequencies(SCIENTIFIC_FREQUENCIES, 'scientific');

  return frequencies;
};

export const [BackendDataProvider, useBackendData] = createContextHook<BackendDataState>(() => {
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [curatedPrograms, setCuratedPrograms] = useState<CuratedProgram[]>([]);
  const [articles, setArticles] = useState<LearningArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();

  const frequenciesRef = collection(db, 'frequencies');
  const curatedProgramsRef = collection(db, 'curatedPrograms');
  const articlesRef = collection(db, 'articles');

  const loadLocalFallback = useCallback(async () => {
    // Only frequencies have a canonical client-side default (from constants)
    // Curated programs and articles must come from Firestore (seeded by admin/backend)
    const storedFrequencies = await AsyncStorage.getItem(STORAGE_KEYS.frequencies);
    const defaultFrequencies = convertFrequencies();

    if (storedFrequencies) {
      setFrequencies(JSON.parse(storedFrequencies));
    } else {
      setFrequencies(defaultFrequencies);
      await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(defaultFrequencies));
    }

    const storedPrograms = await AsyncStorage.getItem(STORAGE_KEYS.curatedPrograms);
    if (storedPrograms) {
      setCuratedPrograms(JSON.parse(storedPrograms));
    }
    // No client-side default for curated programs — admin must seed them

    const storedArticles = await AsyncStorage.getItem(STORAGE_KEYS.articles);
    if (storedArticles) {
      setArticles(JSON.parse(storedArticles));
    }
    // No client-side default for articles — admin must seed them
  }, []);

  const seedFirestore = useCallback(async () => {
    const seededFrequencies = convertFrequencies();
    const batch = writeBatch(db);

    seededFrequencies.forEach((frequency) => {
      batch.set(doc(frequenciesRef, frequency.id), frequency);
    });

    // Note: Curated programs and articles are NOT auto-seeded by the client.
    // They must be seeded by the admin via the backend API or admin panel.
    // The seed data lives in backend/seed.ts as the single canonical source.

    await batch.commit();
    console.log('✅ Firestore seeded with canonical frequencies');

    return {
      frequencies: seededFrequencies,
      curatedPrograms: [] as CuratedProgram[],
      articles: [] as LearningArticle[],
    };
  }, [frequenciesRef]);

  const loadFromFirestore = useCallback(async () => {
    // 10-second timeout for the firestore fetch to prevent hanging
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

    // Seed frequencies if Firestore is empty (frequencies are canonical from constants)
    const needsFreqSeed = frequencySnapshot.empty;
    let loadedFrequencies: Frequency[] = [];

    if (needsFreqSeed) {
      loadedFrequencies = convertFrequencies();
      try {
        const batch = writeBatch(db);
        loadedFrequencies.forEach((freq) => {
          batch.set(doc(frequenciesRef, freq.id), freq);
        });
        await batch.commit();
      } catch {
        // No write permission — local defaults are sufficient
        console.warn('Cannot seed Firestore (insufficient permissions), using local frequencies');
      }
    } else {
      loadedFrequencies = frequencySnapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Frequency),
        id: docSnap.id,
      }));
    }

    const loadedPrograms = programSnapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as CuratedProgram),
      id: docSnap.id,
    }));

    const loadedArticles = articleSnapshot.docs.map((docSnap) => ({
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
    // If in local-only mode, skip Firestore entirely
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
      // Fire-and-forget: cache to AsyncStorage without blocking
      AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(remote.frequencies)).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(remote.curatedPrograms)).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(remote.articles)).catch(() => {});
    } catch (error: any) {
      if (isCloudStrict) {
        // In cloud-strict mode, surface the error clearly
        const msg = error?.code === 'permission-denied'
          ? 'Firestore permissions denied — deploy firestore.rules first'
          : `Firestore fetch failed: ${error?.message || error}`;
        setCloudError(msg);
        console.error('❌ Cloud mode: ' + msg);
        setIsLoading(false);
        throw error;
      }
      // Auto mode: silent fallback
      if (error?.code === 'permission-denied') {
        console.warn('Firestore rules not deployed — using local data');
      } else {
        console.error('❌ Firestore fetch failed, falling back to local data:', error);
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

  // ── Mutation helpers — mode-aware ──
  /** Try Firestore write; in cloud-strict mode surface errors, otherwise continue locally */
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

  const addFrequency = useCallback(async (frequency: Omit<Frequency, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const newFrequency: Frequency = { ...frequency, id };
    await mutateWithFirestore(
      () => setDoc(doc(frequenciesRef, id), newFrequency),
      'addFrequency'
    );
    const updated = [...frequencies, newFrequency];
    setFrequencies(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(updated));
  }, [frequencies, frequenciesRef, mutateWithFirestore]);

  const updateFrequency = useCallback(async (id: string, frequency: Partial<Frequency>) => {
    await mutateWithFirestore(
      () => updateDoc(doc(frequenciesRef, id), frequency),
      'updateFrequency'
    );
    const updated = frequencies.map((item) => (item.id === id ? { ...item, ...frequency } : item));
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
    const newProgram: CuratedProgram = {
      ...program,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    await mutateWithFirestore(
      () => updateDoc(doc(curatedProgramsRef, id), { ...program, updatedAt: new Date().toISOString() }),
      'updateCuratedProgram'
    );
    const updated = curatedPrograms.map((item) =>
      item.id === id ? { ...item, ...program, updatedAt: new Date().toISOString() } : item
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

  const addArticle = useCallback(async (article: Omit<LearningArticle, 'id' | 'publishedAt'>) => {
    const id = `article-${Date.now()}`;
    const newArticle: LearningArticle = {
      ...article,
      id,
      publishedAt: new Date().toISOString(),
    };
    await mutateWithFirestore(
      () => setDoc(doc(articlesRef, id), newArticle),
      'addArticle'
    );
    const updated = [...articles, newArticle];
    setArticles(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(updated));
  }, [articles, articlesRef, mutateWithFirestore]);

  const updateArticle = useCallback(async (id: string, article: Partial<LearningArticle>) => {
    await mutateWithFirestore(
      () => updateDoc(doc(articlesRef, id), article),
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
