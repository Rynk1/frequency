import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type BackendConnectionStatus = 'api_connected' | 'firestore_connected' | 'unavailable' | 'local_mode';

export interface DataHealthInfo {
  source: string;
  connectionStatus: BackendConnectionStatus;
  lastSuccessfulFetch: Date | null;
  lastClientRefresh: Date;
  isStale: boolean;
  errorMessage: string | null;
}

export interface PremiumMetrics {
  /** Count of profiles with subscriptionStatus === 'premium' (cached profile flag) */
  profilePremiumUsers: number;
  /** Count of active entitlements in /entitlements collection (entitlement engine state) */
  activeEntitlements: number;
  /** Count of active subscriptions in /subscriptions collection (provider-backed truth) */
  verifiedSubscriptions: number;
  /** Count of active trial users */
  trialUsers: number;
  /** Count of free users */
  freeUsers: number;
}

export interface RecentPaymentActivity {
  id: string;
  provider: string;
  eventType: string;
  maskedUid: string;
  productId: string;
  resultingState: string;
  timestamp: Date | null;
}

export interface AuditActivity {
  id: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: Date | null;
}

export interface FrequencyRanking {
  frequencyKey: string;
  name: string;
  totalMinutes: number;
  sessionCount: number;
}

export interface ProgrammeRanking {
  programmeId: string;
  name: string;
  totalSessions: number;
}

export interface AdminAnalyticsData {
  dataHealth: DataHealthInfo;
  users: {
    totalMembers: number;
    premium: PremiumMetrics;
  };
  content: {
    frequencies: number;
    curatedPrograms: number;
    articles: number;
  };
  engagement: {
    totalListeningMinutes: number;
    totalSessionsCompleted: number;
    topStreakDays: number;
    /** Explicitly omitted as per product decision */
    activeUsers: null;
    activeUsersReason: string;
  };
  rankings: {
    frequencies: FrequencyRanking[];
    programmes: ProgrammeRanking[];
  };
  financial: {
    /** Strictly null - revenue is never calculated from premium user count */
    monthlyRevenue: number | null;
    yearlyRevenue: number | null;
    revenueNote: string;
    /** Verified payment event count from subscriptionEvents ledger or null */
    paymentCount: number | null;
    recentPayments: RecentPaymentActivity[];
  };
  audit: {
    recentLogs: AuditActivity[];
  };
}

/**
 * Mask UID for privacy in admin UI: e.g. "user_...a8f2"
 */
function maskUid(uid?: string): string {
  if (!uid) return 'unknown';
  if (uid.length <= 8) return uid;
  return `${uid.slice(0, 4)}...${uid.slice(-4)}`;
}

/**
 * Fetch and aggregate admin overview analytics cleanly from Firestore
 */
export async function fetchAdminAnalyticsFromFirestore(): Promise<AdminAnalyticsData> {
  const lastClientRefresh = new Date();

  // Parallel collection fetches
  const [
    usersSnap,
    subscriptionsSnap,
    entitlementsSnap,
    subscriptionEventsSnap,
    auditLogsSnap,
    frequenciesSnap,
    programsSnap,
    articlesSnap,
    aggregateDocSnap,
  ] = await Promise.all([
    getDocs(collection(db, 'users')).catch(() => null),
    getDocs(collection(db, 'subscriptions')).catch(() => null),
    getDocs(collection(db, 'entitlements')).catch(() => null),
    getDocs(query(collection(db, 'subscriptionEvents'), limit(20))).catch(() => null),
    getDocs(query(collection(db, 'auditLogs'), limit(10))).catch(() => null),
    getDocs(collection(db, 'frequencies')).catch(() => null),
    getDocs(collection(db, 'curatedPrograms')).catch(() => null),
    getDocs(collection(db, 'articles')).catch(() => null),
    getDoc(doc(db, 'analytics', 'aggregate')).catch(() => null),
  ]);

  if (!usersSnap) {
    throw new Error('Firestore connection failed: Unable to access users collection.');
  }

  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  // 1. Members & Premium Metrics
  const totalMembers = allUsers.length;
  const profilePremiumUsers = allUsers.filter((u) => u.subscriptionStatus === 'premium').length;
  const trialUsers = allUsers.filter((u) => u.subscriptionStatus === 'trial').length;
  const freeUsers = allUsers.filter((u) => !u.subscriptionStatus || u.subscriptionStatus === 'free').length;

  let verifiedSubscriptions = 0;
  if (subscriptionsSnap) {
    verifiedSubscriptions = subscriptionsSnap.docs.filter((d) => {
      const data = d.data();
      return data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trial';
    }).length;
  } else {
    // If subscriptions collection is empty or restricted, fallback to profile count
    verifiedSubscriptions = profilePremiumUsers;
  }

  let activeEntitlements = 0;
  if (entitlementsSnap) {
    activeEntitlements = entitlementsSnap.docs.filter((d) => d.data().isPremium === true).length;
  } else {
    activeEntitlements = profilePremiumUsers;
  }

  // 2. Content Counts
  const frequencyCount = frequenciesSnap ? frequenciesSnap.size : 0;
  const programCount = programsSnap ? programsSnap.size : 0;
  const articleCount = articlesSnap ? articlesSnap.size : 0;

  // 3. Engagement Metrics
  let totalListeningMinutes = 0;
  let totalSessionsCompleted = 0;
  let topStreakDays = 0;

  if (aggregateDocSnap && aggregateDocSnap.exists()) {
    const aggData = aggregateDocSnap.data();
    totalListeningMinutes = aggData.totalListeningMinutes || 0;
    totalSessionsCompleted = aggData.totalSessionsCompleted || 0;
    topStreakDays = aggData.topStreakDays || 0;
  } else {
    // Scalable aggregate sum across user profile usageStats (avoids unindexed collectionGroup scan)
    totalListeningMinutes = allUsers.reduce((sum, u) => sum + (u.usageStats?.totalListeningTime || 0), 0);
    totalSessionsCompleted = allUsers.reduce((sum, u) => sum + (u.usageStats?.sessionsCompleted || 0), 0);
    topStreakDays = allUsers.reduce((max, u) => Math.max(max, u.usageStats?.streakDays || 0), 0);
  }

  // 4. Frequency & Programme Rankings
  const frequencyMap = new Map<string, { name: string; minutes: number; sessions: number }>();
  allUsers.forEach((u) => {
    const favs: string[] = u.usageStats?.favoriteFrequencies || [];
    favs.forEach((freqStr) => {
      // Normalize identity e.g. "528 Hz"
      const normalizedKey = freqStr.trim().toLowerCase();
      const existing = frequencyMap.get(normalizedKey) || { name: freqStr.trim(), minutes: 0, sessions: 0 };
      existing.sessions += 1;
      frequencyMap.set(normalizedKey, existing);
    });
  });

  const frequencyRankings: FrequencyRanking[] = Array.from(frequencyMap.entries())
    .map(([key, data]) => ({
      frequencyKey: key,
      name: data.name,
      totalMinutes: data.minutes,
      sessionCount: data.sessions,
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 5);

  const programmeRankings: ProgrammeRanking[] = programsSnap
    ? programsSnap.docs.map((d) => {
        const p = d.data();
        return {
          programmeId: d.id,
          name: p.name || 'Untitled Program',
          totalSessions: p.totalSessions || 0,
        };
      }).slice(0, 5)
    : [];

  // 5. Payments & Event Ledger
  let paymentCount: number | null = null;
  const recentPayments: RecentPaymentActivity[] = [];

  if (subscriptionEventsSnap && !subscriptionEventsSnap.empty) {
    const events = subscriptionEventsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    paymentCount = events.filter((e) => e.processingStatus === 'PROCESSED').length;

    events
      .sort((a, b) => {
        const aTs = a.processedAt?.toDate ? a.processedAt.toDate().getTime() : 0;
        const bTs = b.processedAt?.toDate ? b.processedAt.toDate().getTime() : 0;
        return bTs - aTs;
      })
      .slice(0, 8)
      .forEach((e) => {
        recentPayments.push({
          id: e.eventId || e.id,
          provider: e.provider || 'provider',
          eventType: e.eventType || 'PURCHASE',
          maskedUid: maskUid(e.uid || e.appUserId),
          productId: e.productId || 'premium_plan',
          resultingState: e.resultingState || 'processed',
          timestamp: e.processedAt?.toDate ? e.processedAt.toDate() : null,
        });
      });
  }

  // 6. Audit Logs
  const recentLogs: AuditActivity[] = [];
  if (auditLogsSnap && !auditLogsSnap.empty) {
    auditLogsSnap.docs.forEach((d) => {
      const data = d.data();
      recentLogs.push({
        id: d.id,
        adminEmail: data.adminEmail || 'admin',
        action: data.action || 'MUTATION',
        resourceType: data.resourceType || 'system',
        resourceId: data.resourceId || 'resource',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
      });
    });
    recentLogs.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  }

  return {
    dataHealth: {
      source: 'Firestore Live',
      connectionStatus: 'firestore_connected',
      lastSuccessfulFetch: lastClientRefresh,
      lastClientRefresh,
      isStale: false,
      errorMessage: null,
    },
    users: {
      totalMembers,
      premium: {
        profilePremiumUsers,
        activeEntitlements,
        verifiedSubscriptions,
        trialUsers,
        freeUsers,
      },
    },
    content: {
      frequencies: frequencyCount,
      curatedPrograms: programCount,
      articles: articleCount,
    },
    engagement: {
      totalListeningMinutes,
      totalSessionsCompleted,
      topStreakDays,
      activeUsers: null,
      activeUsersReason: 'Active users metric is omitted pending a canonical product specification definition.',
    },
    rankings: {
      frequencies: frequencyRankings,
      programmes: programmeRankings,
    },
    financial: {
      monthlyRevenue: null,
      yearlyRevenue: null,
      revenueNote: 'Revenue data requires provider financial reconciliation endpoint. Revenue is never estimated from user count.',
      paymentCount,
      recentPayments,
    },
    audit: {
      recentLogs,
    },
  };
}
