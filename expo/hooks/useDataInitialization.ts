import { useEffect, useState } from 'react';
import { useBackendData } from './useBackendData';

export function useDataInitialization() {
  const { frequencies, curatedPrograms, articles, isLoading, syncData } = useBackendData();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      const timeout = setTimeout(() => {
        setIsInitialized(true);
      }, 2000);
      
      try {
        await syncData();
        clearTimeout(timeout);
        setIsInitialized(true);
      } catch (error) {
        setInitError(error instanceof Error ? error.message : 'Failed to sync');
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, syncData]);

  return {
    isInitialized,
    isLoading: isLoading && !isInitialized,
    initError,
    hasData: frequencies.length > 0 || curatedPrograms.length > 0 || articles.length > 0,
    dataStats: {
      frequencies: frequencies.length,
      curatedPrograms: curatedPrograms.length,
      articles: articles.length,
    }
  };
}