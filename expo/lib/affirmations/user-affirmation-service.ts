import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserCustomAffirmation, AffirmationCategory } from '../../types/affirmation';
import { sanitizeForFirestore } from '../validation';

const LOCAL_STORAGE_KEY_PREFIX = 'hf:user:custom_affirmations:';

export class UserAffirmationService {
  private static getStorageKey(userId: string): string {
    return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
  }

  /**
   * Fetch all user custom affirmations (Firestore authoritative with local cache fallback)
   */
  public static async getUserAffirmations(userId: string): Promise<UserCustomAffirmation[]> {
    if (!userId) return [];

    try {
      // 1. Fetch from Firestore subcollection: userAffirmations/{userId}/custom
      if (db) {
        const customColRef = collection(db, 'userAffirmations', userId, 'custom');
        const q = query(customColRef, orderBy('createdAt', 'desc'));
        const querySnap = await getDocs(q);

        const items: UserCustomAffirmation[] = [];
        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            userId,
            title: data.title || 'Untitled Affirmation',
            text: data.text || '',
            category: (data.category as AffirmationCategory) || 'self_care',
            audioUri: data.audioUri || null,
            audioBase64: data.audioBase64 || null,
            durationSeconds: data.durationSeconds || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });

        // Update local cache
        await AsyncStorage.setItem(this.getStorageKey(userId), JSON.stringify(items));
        return items;
      }
    } catch (err) {
      console.warn('[UserAffirmationService] Firestore fetch failed, loading local cache:', err);
    }

    // Fallback to local AsyncStorage
    try {
      const cached = await AsyncStorage.getItem(this.getStorageKey(userId));
      if (cached) {
        return JSON.parse(cached) as UserCustomAffirmation[];
      }
    } catch (cacheErr) {
      console.warn('[UserAffirmationService] Cache read error:', cacheErr);
    }

    return [];
  }

  /**
   * Save or update a custom user affirmation
   */
  public static async saveUserAffirmation(
    userId: string,
    affirmation: Omit<UserCustomAffirmation, 'userId' | 'createdAt' | 'updatedAt' | 'id'> & { id?: string }
  ): Promise<UserCustomAffirmation> {
    if (!userId) throw new Error('User ID is required to save a custom affirmation.');

    const now = new Date().toISOString();
    const affirmationId = affirmation.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const record: UserCustomAffirmation = {
      id: affirmationId,
      userId,
      title: affirmation.title.trim() || 'My Written Affirmation',
      text: affirmation.text.trim(),
      category: affirmation.category || 'self_care',
      audioUri: affirmation.audioUri || null,
      audioBase64: affirmation.audioBase64 || null,
      durationSeconds: affirmation.durationSeconds || 0,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Persist to Firestore
    if (db) {
      try {
        const docRef = doc(db, 'userAffirmations', userId, 'custom', affirmationId);
        const firestorePayload = sanitizeForFirestore({
          title: record.title,
          text: record.text,
          category: record.category,
          audioUri: record.audioUri,
          audioBase64: record.audioBase64,
          durationSeconds: record.durationSeconds,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        });
        await setDoc(docRef, firestorePayload, { merge: true });
      } catch (err) {
        console.warn('[UserAffirmationService] Firestore write failed:', err);
      }
    }

    // 2. Update Local Cache
    try {
      const existing = await this.getUserAffirmations(userId);
      const updatedList = [record, ...existing.filter((item) => item.id !== affirmationId)];
      await AsyncStorage.setItem(this.getStorageKey(userId), JSON.stringify(updatedList));
    } catch (cacheErr) {
      console.warn('[UserAffirmationService] Cache write failed:', cacheErr);
    }

    return record;
  }

  /**
   * Delete a user custom affirmation
   */
  public static async deleteUserAffirmation(userId: string, affirmationId: string): Promise<void> {
    if (!userId || !affirmationId) return;

    if (db) {
      try {
        const docRef = doc(db, 'userAffirmations', userId, 'custom', affirmationId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[UserAffirmationService] Firestore delete failed:', err);
      }
    }

    try {
      const existing = await this.getUserAffirmations(userId);
      const filtered = existing.filter((item) => item.id !== affirmationId);
      await AsyncStorage.setItem(this.getStorageKey(userId), JSON.stringify(filtered));
    } catch (cacheErr) {
      console.warn('[UserAffirmationService] Cache delete failed:', cacheErr);
    }
  }
}
