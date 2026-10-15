import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserAffirmationService } from '../lib/affirmations/user-affirmation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage with in-memory map
let mockStore: Record<string, string> = {};

vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      getItem: vi.fn(async (key: string) => mockStore[key] || null),
      setItem: vi.fn(async (key: string, value: string) => {
        mockStore[key] = value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete mockStore[key];
      }),
      clear: vi.fn(async () => {
        mockStore = {};
      }),
    },
  };
});

// Mock Firestore db as null for offline / unit testing fallback
vi.mock('../lib/firebase', () => ({
  db: null,
}));

describe('UserAffirmationService', () => {
  const testUid = 'user-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = {};
  });

  it('saves custom affirmation and reads back from storage', async () => {
    const saved = await UserAffirmationService.saveUserAffirmation(testUid, {
      title: 'Morning Confidence',
      text: 'I am calm, focused, and present.',
      category: 'confidence',
      durationSeconds: 12,
    });

    expect(saved.id).toBeDefined();
    expect(saved.userId).toBe(testUid);
    expect(saved.title).toBe('Morning Confidence');
    expect(saved.text).toBe('I am calm, focused, and present.');
    expect(saved.category).toBe('confidence');

    const items = await UserAffirmationService.getUserAffirmations(testUid);
    expect(items.length).toBe(1);
    expect(items[0].title).toBe('Morning Confidence');
  });

  it('deletes custom affirmation successfully', async () => {
    const saved = await UserAffirmationService.saveUserAffirmation(testUid, {
      title: 'To Delete',
      text: 'Temporary statement.',
      category: 'self_care',
    });

    let items = await UserAffirmationService.getUserAffirmations(testUid);
    expect(items.length).toBe(1);

    await UserAffirmationService.deleteUserAffirmation(testUid, saved.id);

    items = await UserAffirmationService.getUserAffirmations(testUid);
    expect(items.length).toBe(0);
  });
});
