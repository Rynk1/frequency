import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAdminAnalyticsFromFirestore,
  AdminAnalyticsData,
  DataHealthInfo,
} from '../lib/admin-analytics';

// Mock Firebase Firestore module for vitest
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((_db, name) => ({ _type: 'collection', name })),
    doc: vi.fn((_db, name, id) => ({ _type: 'doc', name, id })),
    query: vi.fn((coll) => coll),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(async (coll) => {
      const name = coll.name;
      if (name === 'users') {
        return {
          size: 3,
          docs: [
            {
              id: 'user_123456789',
              data: () => ({
                email: 'user1@example.com',
                subscriptionStatus: 'premium',
                createdAt: { toDate: () => new Date('2025-01-01') },
                usageStats: { sessionsCompleted: 5, totalListeningTime: 120, favoriteFrequencies: ['528 Hz', '432 Hz'] },
              }),
            },
            {
              id: 'user_223456789',
              data: () => ({
                email: 'user2@example.com',
                subscriptionStatus: 'trial',
                createdAt: { toDate: () => new Date('2025-01-05') },
                usageStats: { sessionsCompleted: 2, totalListeningTime: 45, favoriteFrequencies: ['528 Hz'] },
              }),
            },
            {
              id: 'user_323456789',
              data: () => ({
                email: 'user3@example.com',
                subscriptionStatus: 'free',
                createdAt: { toDate: () => new Date('2025-01-10') },
                usageStats: { sessionsCompleted: 0, totalListeningTime: 0, favoriteFrequencies: [] },
              }),
            },
          ],
        };
      }
      if (name === 'subscriptions') {
        return {
          size: 1,
          docs: [
            { id: 'user_123456789', data: () => ({ subscriptionStatus: 'active', provider: 'revenuecat' }) },
          ],
        };
      }
      if (name === 'entitlements') {
        return {
          size: 1,
          docs: [
            { id: 'user_123456789', data: () => ({ isPremium: true, status: 'active' }) },
          ],
        };
      }
      if (name === 'subscriptionEvents') {
        return {
          empty: false,
          docs: [
            {
              id: 'evt_101',
              data: () => ({
                eventId: 'evt_101',
                provider: 'revenuecat',
                eventType: 'INITIAL_PURCHASE',
                uid: 'user_123456789',
                productId: 'monthly_premium',
                processingStatus: 'PROCESSED',
                resultingState: 'active',
                processedAt: { toDate: () => new Date('2025-01-01T10:00:00Z') },
              }),
            },
          ],
        };
      }
      if (name === 'auditLogs') {
        return {
          empty: false,
          docs: [
            {
              id: 'log_1',
              data: () => ({
                adminEmail: 'admin@harmonyfrequency.app',
                action: 'SET_ADMIN_CLAIMS',
                resourceType: 'user',
                resourceId: 'user_123456789',
                createdAt: { toDate: () => new Date('2025-01-01T09:00:00Z') },
              }),
            },
          ],
        };
      }
      if (name === 'frequencies') {
        return { size: 12, docs: [] };
      }
      if (name === 'curatedPrograms') {
        return { size: 4, docs: [{ id: 'p1', data: () => ({ name: 'Deep Sleep', totalSessions: 15 }) }] };
      }
      if (name === 'articles') {
        return { size: 8, docs: [] };
      }
      return { size: 0, docs: [], empty: true };
    }),
    getDoc: vi.fn(async (docRef) => {
      if (docRef.name === 'analytics' && docRef.id === 'aggregate') {
        return {
          exists: () => true,
          data: () => ({
            totalListeningMinutes: 165,
            totalSessionsCompleted: 7,
            topStreakDays: 12,
          }),
        };
      }
      return { exists: () => false };
    }),
  };
});

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('Admin Overview Source-of-Truth Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Source Modes & Data Health', () => {
    it('returns firestore_connected health state when Firestore fetch succeeds', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.dataHealth.connectionStatus).toBe('firestore_connected');
      expect(data.dataHealth.source).toBe('Firestore Live');
      expect(data.dataHealth.isStale).toBe(false);
      expect(data.dataHealth.errorMessage).toBeNull();
    });

    it('throws diagnostic error if Firestore users collection is inaccessible', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(fetchAdminAnalyticsFromFirestore()).rejects.toThrow('Firestore connection failed');
    });
  });

  describe('Members & User Counts', () => {
    it('correctly aggregates member counts from authoritative Firestore /users', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.users.totalMembers).toBe(3);
      expect(data.users.premium.freeUsers).toBe(1);
      expect(data.users.premium.trialUsers).toBe(1);
    });
  });

  describe('Premium Detail & Semantics', () => {
    it('distinguishes profile premium flag, active entitlements, and verified subscriptions', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.users.premium.profilePremiumUsers).toBe(1);
      expect(data.users.premium.activeEntitlements).toBe(1);
      expect(data.users.premium.verifiedSubscriptions).toBe(1);
    });
  });

  describe('Revenue & Payments Rules', () => {
    it('STRICT MATRIX COMPLIANCE: monthlyRevenue is strictly null and NEVER calculated from premium user count', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.financial.monthlyRevenue).toBeNull();
      expect(data.financial.yearlyRevenue).toBeNull();
      expect(data.financial.revenueNote).toContain('Revenue is never estimated from user count');
    });

    it('derives verified payment count from subscriptionEvents ledger', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.financial.paymentCount).toBe(1);
      expect(data.financial.recentPayments).toHaveLength(1);
      expect(data.financial.recentPayments[0].eventType).toBe('INITIAL_PURCHASE');
      expect(data.financial.recentPayments[0].maskedUid).toContain('user...');
    });
  });

  describe('Completed Sessions & Listening Semantics', () => {
    it('uses canonical completed sessions aggregate rather than raw event tick counts', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.engagement.totalSessionsCompleted).toBe(7);
      expect(data.engagement.totalListeningMinutes).toBe(165);
    });

    it('omits active users metric explicitly with explanatory reason', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.engagement.activeUsers).toBeNull();
      expect(data.engagement.activeUsersReason).toBeDefined();
    });
  });

  describe('Rankings & Normalization', () => {
    it('normalizes frequency identity keys (e.g. 528 Hz)', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.rankings.frequencies).toHaveLength(2);
      expect(data.rankings.frequencies[0].name).toBe('528 Hz');
      expect(data.rankings.frequencies[0].sessionCount).toBe(2);
    });

    it('uses stable programme IDs for program rankings', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.rankings.programmes).toHaveLength(1);
      expect(data.rankings.programmes[0].programmeId).toBe('p1');
      expect(data.rankings.programmes[0].name).toBe('Deep Sleep');
    });
  });

  describe('Security Audit Activity', () => {
    it('returns server-written audit activity with actor and resource metadata', async () => {
      const data = await fetchAdminAnalyticsFromFirestore();
      expect(data.audit.recentLogs).toHaveLength(1);
      expect(data.audit.recentLogs[0].action).toBe('SET_ADMIN_CLAIMS');
      expect(data.audit.recentLogs[0].adminEmail).toBe('admin@harmonyfrequency.app');
    });
  });
});
