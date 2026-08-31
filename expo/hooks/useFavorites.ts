import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Frequency {
  name: string;
  hz: number;
  description: string;
  gradient?: readonly [string, string, ...string[]];
  [key: string]: any;
}

const FAVORITES_KEY = 'frequency_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Frequency[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load favorites from storage
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: Frequency[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = useCallback((frequency: Frequency) => {
    setFavorites(prev => {
      const isAlreadyFavorite = prev.some(fav => fav.hz === frequency.hz);
      let newFavorites: Frequency[];
      
      if (isAlreadyFavorite) {
        newFavorites = prev.filter(fav => fav.hz !== frequency.hz);
      } else {
        newFavorites = [...prev, frequency];
      }
      
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((hz: number) => {
    return favorites.some(fav => fav.hz === hz);
  }, [favorites]);

  const clearFavorites = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(FAVORITES_KEY);
      setFavorites([]);
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  }, []);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
};