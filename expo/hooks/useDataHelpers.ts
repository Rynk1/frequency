import { useBackendData } from './useBackendData';
import { useMemo } from 'react';
import { FrequencyCategory, ArticleCategory } from '@/types/content';

export function useFrequencies() {
  const { frequencies } = useBackendData();

  return useMemo(() => ({
    frequencies,
    solfeggio: frequencies.filter(f => f.category === FrequencyCategory.SOLFEGGIO),
    chakra: frequencies.filter(f => f.category === FrequencyCategory.CHAKRA),
    binaural: frequencies.filter(f => f.category === FrequencyCategory.BINAURAL),
    healing: frequencies.filter(f => f.category === FrequencyCategory.HEALING),
    sleep: frequencies.filter(f => f.category === FrequencyCategory.SLEEP),
    wealth: frequencies.filter(f => f.category === FrequencyCategory.WEALTH),
    scientific: frequencies.filter(f => f.category === FrequencyCategory.SCIENTIFIC),
  }), [frequencies]);
}

export function useCuratedPrograms() {
  const { curatedPrograms } = useBackendData();

  return useMemo(() => ({
    curatedPrograms,
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
    solfeggio: articles.filter(a => a.category === ArticleCategory.SOLFEGGIO),
    chakras: articles.filter(a => a.category === ArticleCategory.CHAKRAS),
    brainwaves: articles.filter(a => a.category === ArticleCategory.BRAINWAVES),
    healing: articles.filter(a => a.category === ArticleCategory.HEALING),
    sleep: articles.filter(a => a.category === ArticleCategory.SLEEP),
    manifestation: articles.filter(a => a.category === ArticleCategory.MANIFESTATION),
    science: articles.filter(a => a.category === ArticleCategory.SCIENCE),
  }), [articles]);
}

export function useFrequencyById(id: string) {
  const { frequencies } = useBackendData();

  return useMemo(() =>
    frequencies.find(f => f.id === id),
    [frequencies, id]
  );
}

export function useCuratedProgramById(id: string) {
  const { curatedPrograms } = useBackendData();

  return useMemo(() =>
    curatedPrograms.find(s => s.id === id),
    [curatedPrograms, id]
  );
}

export function useArticleById(id: string) {
  const { articles } = useBackendData();

  return useMemo(() =>
    articles.find(a => a.id === id),
    [articles, id]
  );
}

export function useSearchFrequencies(query: string) {
  const { frequencies } = useBackendData();

  return useMemo(() => {
    if (!query.trim()) return frequencies;

    const searchLower = query.toLowerCase();
    return frequencies.filter(f =>
      f.name.toLowerCase().includes(searchLower) ||
      f.description.toLowerCase().includes(searchLower) ||
      f.category.toLowerCase().includes(searchLower) ||
      (f.tags || []).some(tag => tag.toLowerCase().includes(searchLower)) ||
      (f.benefits || []).some(benefit => benefit.toLowerCase().includes(searchLower))
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
      (a.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
    );
  }, [articles, query]);
}

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
