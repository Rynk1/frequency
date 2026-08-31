import { z } from 'zod';

// ── Frequency ──
export const frequencySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  hz: z.number().positive('Hz must be positive').max(2000, 'Hz cannot exceed 2000'),
  frequency: z.string().min(1),
  description: z.string().min(1, 'Description is required').max(2000),
  category: z.enum(['solfeggio', 'chakra', 'brainwave', 'healing', 'sleep', 'manifestation', 'scientific']),
  color: z.string().optional(),
  gradient: z.array(z.string()).length(2).optional(),
  benefits: z.array(z.string()).min(1, 'At least one benefit is required'),
  isPremium: z.boolean(),
  tags: z.array(z.string()),
  scientificBasis: z.string().optional(),
  usageGuidelines: z.string().optional(),
  duration: z.string().optional(),
  research: z.string().optional(),
});

export const createFrequencySchema = frequencySchema.omit({ id: true });
export const updateFrequencySchema = frequencySchema.partial().omit({ id: true });

// ── Curated Program ──
export const curatedProgramSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  frequencies: z.array(z.string()).min(1, 'At least one frequency is required'),
  duration: z.number().int().positive('Duration must be positive').max(480, 'Duration cannot exceed 8 hours'),
  category: z.enum(['healing', 'meditation', 'sleep', 'focus', 'manifestation', 'energy', 'general']),
  isPremium: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const createCuratedProgramSchema = curatedProgramSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateCuratedProgramSchema = curatedProgramSchema.partial().omit({ id: true });

// ── Learning Article ──
export const learningArticleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(300),
  content: z.string().min(1, 'Content is required').max(100000),
  category: z.enum(['solfeggio', 'chakra', 'brainwave', 'healing', 'sleep', 'manifestation', 'scientific']),
  tags: z.array(z.string()),
  isPremium: z.boolean(),
  publishedAt: z.string().datetime().optional(),
  author: z.string().min(1, 'Author is required'),
  readTime: z.number().int().positive().optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  keyPoints: z.array(z.string()).optional(),
  practicalTips: z.array(z.string()).optional(),
  scientificBasis: z.string().optional(),
  historicalContext: z.string().optional(),
});

export const createArticleSchema = learningArticleSchema.omit({ id: true, publishedAt: true });
export const updateArticleSchema = learningArticleSchema.partial().omit({ id: true });

// ── Audit Log ──
export const auditLogSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  adminId: z.string(),
  adminEmail: z.string(),
  action: z.enum(['create', 'update', 'delete', 'reset', 'cancel']),
  resource: z.enum(['frequency', 'curatedProgram', 'article', 'data', 'adminClaim', 'subscription']),
  resourceId: z.string(),
  changes: z.record(z.string(), z.unknown()).optional(),
  previousState: z.record(z.string(), z.unknown()).optional(),
});

export type AuditLogEntry = z.infer<typeof auditLogSchema>;

// ── Inferred types ──
export type FrequencyInput = z.infer<typeof createFrequencySchema>;
export type FrequencyUpdate = z.infer<typeof updateFrequencySchema>;
export type CuratedProgramInput = z.infer<typeof createCuratedProgramSchema>;
export type CuratedProgramUpdate = z.infer<typeof updateCuratedProgramSchema>;
export type ArticleInput = z.infer<typeof createArticleSchema>;
export type ArticleUpdate = z.infer<typeof updateArticleSchema>;
