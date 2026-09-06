import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useDataMode } from './useDataMode';

interface Frequency {
  name: string;
  hz: number;
  description: string;
  gradient?: readonly [string, string, ...string[]];
  [key: string]: any;
}

const FAVORITES_KEY = 'frequency_favorites';

export const useFavorites = () => {
  const { user } = useAuth();
  const { shouldUseFirestore } = useDataMode();
  const storageKey = user?.uid ? `${FAVORITES_KEY}_${user.uid}` : FAVORITES_KEY;
  const [favorites, setFavorites] = useState<Frequency[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cloud is authoritative when available; device storage keeps the library usable offline.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        let loaded: Frequency[] | null = null;
        if (user?.uid && shouldUseFirestore) {
          const snapshot = await getDoc(doc(db, 'userFavorites', user.uid));
          if (snapshot.exists()) loaded = (snapshot.data().favorites || []) as Frequency[];
        }
        if (!loaded) {
          const stored = await AsyncStorage.getItem(storageKey);
          loaded = stored ? JSON.parse(stored) : [];
        }
        if (mounted) setFavorites(loaded || []);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [shouldUseFirestore, storageKey, user?.uid]);

  const saveFavorites = async (newFavorites: Frequency[]) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newFavorites));
      if (user?.uid && shouldUseFirestore) {
        await setDoc(doc(db, 'userFavorites', user.uid), { favorites: newFavorites }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = async (frequency: Frequency) => {
    const isAlreadyFavorite = favorites.some((fav) => fav.hz === frequency.hz);
    const newFavorites = isAlreadyFavorite
      ? favorites.filter((fav) => fav.hz !== frequency.hz)
      : [...favorites, frequency];
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const isFavorite = (hz: number) => {
    return favorites.some(fav => fav.hz === hz);
  };

  const clearFavorites = async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
      if (user?.uid && shouldUseFirestore) {
        await setDoc(doc(db, 'userFavorites', user.uid), { favorites: [] }, { merge: true });
      }
      setFavorites([]);
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  };

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
};