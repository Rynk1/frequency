import { useBackendData } from './useBackendData';
import { useMemo } from 'react';

// Legacy data compatibility layer
export function useFrequencies() {
  const { frequencies } = useBackendData();
  
  return useMemo(() => ({
    frequencies,
    // Legacy category getters for backward compatibility
    solfeggio: frequencies.filter(f => f.category === 'solfeggio'),
    chakra: frequencies.filter(f => f.category === 'chakra'),
    brainwave: frequencies.filter(f => f.category === 'brainwave'),
    healing: frequencies.filter(f => f.category === 'healing'),
    sleep: frequencies.filter(f => f.category === 'sleep'),
    manifestation: frequencies.filter(f => f.category === 'manifestation'),
    scientific: frequencies.filter(f => f.category === 'scientific'),
  }), [frequencies]);
}

export function useCuratedPrograms() {
  const { curatedPrograms } = useBackendData();
  
  return useMemo(() => ({
    curatedPrograms,
    // Category filters
    energy: curatedPrograms.filter(s => s.category === 'energy'),
    healing: curatedPrograms.filter(s => s.category === 'healing'),
    chakra: curatedPrograms.filter(s => s.category === 'chakra'),
    sleep: curatedPrograms.filter(s => s.category === 'sleep'),
    focus: curatedPrograms.filter(s => s.category === 'focus'),
    manifestation: curatedPrograms.filter(s => s.category === 'manifestation'),
  }), [curatedPrograms]);
}

export function useLearningArticles() {
  const { articles } = useBackendData();
  
  return useMemo(() => ({
    articles,
    // Category filters
    solfeggio: articles.filter(a => a.category === 'solfeggio'),
    chakra: articles.filter(a => a.category === 'chakra'),
    brainwave: articles.filter(a => a.category === 'brainwave'),
    healing: articles.filter(a => a.category === 'healing'),
    sleep: articles.filter(a => a.category === 'sleep'),
    manifestation: articles.filter(a => a.category === 'manifestation'),
    scientific: articles.filter(a => a.category === 'scientific'),
  }), [articles]);
}

// Utility to get frequency by ID
export function useFrequencyById(id: string) {
  const { frequencies } = useBackendData();
  
  return useMemo(() => 
    frequencies.find(f => f.id === id),
    [frequencies, id]
  );
}

// Utility to get session by ID
export function useCuratedProgramById(id: string) {
  const { curatedPrograms } = useBackendData();
  
  return useMemo(() => 
    curatedPrograms.find(s => s.id === id),
    [curatedPrograms, id]
  );
}

// Utility to get article by ID
export function useArticleById(id: string) {
  const { articles } = useBackendData();
  
  return useMemo(() => 
    articles.find(a => a.id === id),
    [articles, id]
  );
}

// Search utilities
export function useSearchFrequencies(query: string) {
  const { frequencies } = useBackendData();
  
  return useMemo(() => {
    if (!query.trim()) return frequencies;
    
    const searchLower = query.toLowerCase();
    return frequencies.filter(f => 
      f.name.toLowerCase().includes(searchLower) ||
      f.description.toLowerCase().includes(searchLower) ||
      f.category.toLowerCase().includes(searchLower) ||
      f.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      f.benefits.some(benefit => benefit.toLowerCase().includes(searchLower))
    );
  }, [frequencies, query]);
}

export function useSearchCuratedPrograms(query: string) {
  const { curatedPrograms } = useBackendData();
  
  return useMemo(() => {
    if (!query.trim()) return curatedPrograms;
    
    const searchLower = query.toLowerCase();
    return curatedPrograms.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower) ||
      s.category.toLowerCase().includes(searchLower)
    );
  }, [curatedPrograms, query]);
}

export function useSearchArticles(query: string) {
  const { articles } = useBackendData();
  
  return useMemo(() => {
    if (!query.trim()) return articles;
    
    const searchLower = query.toLowerCase();
    return articles.filter(a => 
      a.title.toLowerCase().includes(searchLower) ||
      a.content.toLowerCase().includes(searchLower) ||
      a.category.toLowerCase().includes(searchLower) ||
      a.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }, [articles, query]);
}

// Category utilities
export function useFrequencyCategories() {
  const { frequencies } = useBackendData();
  
  return useMemo(() => {
    const categories = new Set(frequencies.map(f => f.category));
    return Array.from(categories).sort();
  }, [frequencies]);
}

export function useCuratedProgramCategories() {
  const { curatedPrograms } = useBackendData();
  
  return useMemo(() => {
    const categories = new Set(curatedPrograms.map(s => s.category));
    return Array.from(categories).sort();
  }, [curatedPrograms]);
}

export function useArticleCategories() {
  const { articles } = useBackendData();
  
  return useMemo(() => {
    const categories = new Set(articles.map(a => a.category));
    return Array.from(categories).sort();
  }, [articles]);
}