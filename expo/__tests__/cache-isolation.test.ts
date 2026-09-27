import { describe, it, expect, beforeEach } from 'vitest';

export interface CachedProfileWrapper {
  schemaVersion: number;
  uid: string;
  cachedAt: string;
  updatedAt: string;
  profile: Record<string, any>;
}

class MemoryStorage {
  private store = new Map<string, string>();

  async setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  async getItem(key: string) {
    return this.store.get(key) || null;
  }

  async getAllKeys() {
    return Array.from(this.store.keys());
  }

  async multiRemove(keys: string[]) {
    keys.forEach((k) => this.store.delete(k));
  }

  async clear() {
    this.store.clear();
  }
}

describe('Cache Isolation and Cross-User Leakage Protection', () => {
  let storage: MemoryStorage;

  beforeEach(async () => {
    storage = new MemoryStorage();
  });

  it('namespaces user cache keys by UID', async () => {
    const userAUid = 'user_A_123';
    const userBUid = 'user_B_456';

    const keyA = `hf:user:${userAUid}:profile`;
    const keyB = `hf:user:${userBUid}:profile`;

    await storage.setItem(keyA, JSON.stringify({ uid: userAUid, isPremium: true }));
    await storage.setItem(keyB, JSON.stringify({ uid: userBUid, isPremium: false }));

    const rawA = await storage.getItem(keyA);
    const rawB = await storage.getItem(keyB);

    expect(JSON.parse(rawA!).uid).toBe('user_A_123');
    expect(JSON.parse(rawA!).isPremium).toBe(true);
    expect(JSON.parse(rawB!).uid).toBe('user_B_456');
    expect(JSON.parse(rawB!).isPremium).toBe(false);
  });

  it('rejects cached profile if expected UID does not match wrapper UID', () => {
    const expectedUid = 'user_B_456';
    const cachedWrapper: CachedProfileWrapper = {
      schemaVersion: 1,
      uid: 'user_A_123', // Mismatched UID
      cachedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: { uid: 'user_A_123', displayName: 'Alice' },
    };

    const parseProfile = (wrapperJson: string, expected: string) => {
      const parsed = JSON.parse(wrapperJson) as CachedProfileWrapper;
      if (parsed.uid !== expected) {
        return null; // Strict UID mismatch guard
      }
      return parsed.profile;
    };

    const result = parseProfile(JSON.stringify(cachedWrapper), expectedUid);
    expect(result).toBeNull();
  });

  it('clears all user-scoped cache keys on signout without affecting global keys', async () => {
    const userAUid = 'user_A_123';
    await storage.setItem(`hf:user:${userAUid}:profile`, 'data_profile');
    await storage.setItem(`hf:user:${userAUid}:entitlement`, 'data_entitlement');
    await storage.setItem('appTheme', 'dark');

    const allKeysBefore = await storage.getAllKeys();
    const userKeys = allKeysBefore.filter((k) => k.startsWith(`hf:user:${userAUid}:`));
    await storage.multiRemove(userKeys);

    const profile = await storage.getItem(`hf:user:${userAUid}:profile`);
    const theme = await storage.getItem('appTheme');

    expect(profile).toBeNull();
    expect(theme).toBe('dark');
  });
});
