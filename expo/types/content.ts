export enum FrequencyCategory {
  SOLFEGGIO = 'solfeggio',
  CHAKRA = 'chakra',
  BINAURAL = 'binaural',
  HEALING = 'healing',
  SLEEP = 'sleep',
  WEALTH = 'wealth',
  SCIENTIFIC = 'scientific',
}

export enum ArticleCategory {
  ALL = 'all',
  SOLFEGGIO = 'solfeggio',
  CHAKRAS = 'chakras',
  BRAINWAVES = 'brainwaves',
  HEALING = 'healing',
  SLEEP = 'sleep',
  MANIFESTATION = 'manifestation',
  SCIENCE = 'science',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface UsageInstructions {
  duration?: string;
  frequency?: string;
  bestTime?: string;
  environment?: string;
  preparation?: string;
}

export interface SeedMetadata {
  provenance: 'system_seed' | 'admin';
  seedVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CanonicalFrequency extends SeedMetadata {
  id: string;
  name: string;
  hz: number;
  frequency: string;
  description: string;
  category: FrequencyCategory;
  color?: string;
  gradient?: [string, string];
  benefits: string[];
  isPremium: boolean;
  status: ContentStatus;

  // Recommendation metadata
  intentTags: string[];
  timeOfDayTags: string[];

  // Science & Details
  background?: string;
  purpose?: string;
  scientificBasis?: string;
  usageInstructions?: UsageInstructions;
  disclaimer?: string;
  research?: string;
  tags?: string[];
}

export interface CanonicalArticle extends SeedMetadata {
  id: string;
  title: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  isPremium: boolean;
  status: ContentStatus;
  author: string;
  readTime: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';

  keyPoints: string[];
  practicalTips: string[];
  scientificBasis?: string;
  historicalContext?: string;

  iconIdentifier: string;
  colorToken: string;
  publishedAt: string;
}
