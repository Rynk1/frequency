import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  gradient?: string[];
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
}

interface AdminDataState {
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
  frequencies: 'adminFrequencies',
  curatedPrograms: 'adminCuratedPrograms',
  articles: 'adminArticles',
} as const;

/** Single canonical source for frequency defaults — identical to useBackendData */
const convertFrequencies = (): Frequency[] => {
  const frequencies: Frequency[] = [];

  const addFrequencies = (list: any[], category: string) => {
    list.forEach((freq) => {
      frequencies.push({
        id: `${category}-${freq.hz}`,
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
  addFrequencies(WEALTH_FREQUENCIES, 'wealth');
  addFrequencies(SCIENTIFIC_FREQUENCIES, 'scientific');

  return frequencies;
};

export const [AdminDataProvider, useAdminData] = createContextHook<AdminDataState>(() => {
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [curatedPrograms, setCuratedPrograms] = useState<CuratedProgram[]>([]);
  const [articles, setArticles] = useState<LearningArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();

  const frequenciesRef = collection(db, 'frequencies');
  const curatedProgramsRef = collection(db, 'curatedPrograms');
  const articlesRef = collection(db, 'articles');

  const loadLocalFallback = useCallback(async () => {
    const storedFrequencies = await AsyncStorage.getItem(STORAGE_KEYS.frequencies);
    if (storedFrequencies) {
      setFrequencies(JSON.parse(storedFrequencies));
    } else {
      const defaultFrequencies = convertFrequencies();
      setFrequencies(defaultFrequencies);
      await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(defaultFrequencies));
    }

    const storedPrograms = await AsyncStorage.getItem(STORAGE_KEYS.curatedPrograms);
    if (storedPrograms) {
      setCuratedPrograms(JSON.parse(storedPrograms));
    }
    // No client-side default for curated programs — seeded by admin

    const storedArticles = await AsyncStorage.getItem(STORAGE_KEYS.articles);
    if (storedArticles) {
      setArticles(JSON.parse(storedArticles));
    }
    // No client-side default for articles — seeded by admin
  }, []);

  const seedFrequenciesIfEmpty = useCallback(async () => {
    const seededFrequencies = convertFrequencies();
    try {
      const batch = writeBatch(db);
      seededFrequencies.forEach((frequency) => {
        batch.set(doc(frequenciesRef, frequency.id), frequency);
      });
      await batch.commit();
      console.log('✅ Firestore seeded with canonical frequencies (admin)');
    } catch {
      console.warn('Cannot seed Firestore (insufficient permissions), using local defaults');
    }
    return seededFrequencies;
  }, [frequenciesRef]);

  const loadFromFirestore = useCallback(async () => {
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
  }, [articlesRef, frequenciesRef, curatedProgramsRef, seedFrequenciesIfEmpty]);

  const loadData = useCallback(async () => {
    // In local mode, skip Firestore entirely
    if (!shouldUseFirestore) {
      setIsLoading(true);
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
      await AsyncStorage.setItem(STORAGE_KEYS.frequencies, JSON.stringify(remote.frequencies));
      await AsyncStorage.setItem(STORAGE_KEYS.curatedPrograms, JSON.stringify(remote.curatedPrograms));
      await AsyncStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(remote.articles));
    } catch (error: any) {
      if (isCloudStrict) {
        const msg = error?.code === 'permission-denied'
          ? 'Firestore permissions denied — deploy firestore.rules first'
          : `Admin Firestore fetch failed: ${error?.message || error}`;
        setCloudError(msg);
        console.error('❌ Cloud mode: ' + msg);
        setIsLoading(false);
        throw error;
      }
      if (error?.code === 'permission-denied') {
        console.warn('Firestore rules not deployed — admin using local data');
      } else {
        console.error('❌ Admin Firestore fetch failed, falling back to local data:', error);
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

  /** Mode-aware Firestore mutation wrapper for admin */
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
