import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { promises as fs } from 'fs';
import path from 'path';
import {
  createFrequencySchema,
  updateFrequencySchema,
  createCuratedProgramSchema,
  updateCuratedProgramSchema,
  createArticleSchema,
  updateArticleSchema,
  AuditLogEntry,
} from '../lib/validation';
import { getSeedData, Frequency, Session as CuratedProgram, LearningArticle } from './seed';
import { getStripe, isStripeConfigured, SUBSCRIPTION_PLANS, getWebhookSecret } from '../lib/stripe-server';
import type Stripe from 'stripe';

// Hono context variables
interface AppVariables {
  adminId: string;
  adminEmail: string;
  userId: string;
  userEmail: string;
  validatedBody: any;
}
type AppContext = Context<{ Variables: AppVariables }>;

interface BackendStore {
  frequencies: Frequency[];
  curatedPrograms: CuratedProgram[];
  articles: LearningArticle[];
  auditLogs: AuditLogEntry[];
}

const DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const AUDIT_PATH = path.join(process.cwd(), 'backend', 'audit.json');

const loadAuditLogs = async (): Promise<AuditLogEntry[]> => {
  try {
    const raw = await fs.readFile(AUDIT_PATH, 'utf-8');
    return JSON.parse(raw) as AuditLogEntry[];
  } catch {
    return [];
  }
};

const saveAuditLogs = async (logs: AuditLogEntry[]) => {
  await fs.writeFile(AUDIT_PATH, JSON.stringify(logs.slice(-5000), null, 2));
};

const writeAuditLog = async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const logs = await loadAuditLogs();
  const logEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  logs.push(logEntry);
  await saveAuditLogs(logs);
  console.log(`[AUDIT] ${entry.action} ${entry.resource} ${entry.resourceId} by ${entry.adminEmail}`);
};

const ensureStore = async (): Promise<BackendStore> => {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      frequencies: (parsed.frequencies as Frequency[]) || [],
      curatedPrograms: ((parsed.curatedPrograms || parsed.sessions) as CuratedProgram[]) || [],
      articles: (parsed.articles as LearningArticle[]) || [],
      auditLogs: [],
    };
  } catch {
    const seed = getSeedData();
    const store: BackendStore = {
      frequencies: seed.frequencies,
      curatedPrograms: seed.sessions,
      articles: seed.articles,
      auditLogs: [],
    };
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true }).catch(() => {});
    await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2));
    return store;
  }
};

const writeStore = async (store: Omit<BackendStore, 'auditLogs'>) => {
  await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2));
};

// ── Admin auth middleware ──
// Verifies Firebase ID token via firebase-admin, or falls back to ADMIN_SECRET_KEY
const adminAuth = async (c: AppContext, next: () => Promise<void>) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized — missing authentication token' }, 401);
  }

  const token = authHeader.slice(7);

  // Try Firebase token verification first
  try {
    // Dynamic import: only attempt Firebase validation if firebase-admin is available
    const { adminAuth: firebaseAdminAuth } = await import('../lib/firebase-admin').catch(() => ({ adminAuth: null }));
    if (firebaseAdminAuth) {
      const decoded = await firebaseAdminAuth.verifyIdToken(token);
      if (!decoded.admin) {
        return c.json({ error: 'Forbidden — admin privileges required' }, 403);
      }
      // Store admin info in context for audit logging
      c.set('adminId', decoded.uid);
      c.set('adminEmail', decoded.email || 'unknown');
      await next();
      return;
    }
  } catch {
    // Firebase verification failed, fall through to secret key check
  }

  // Fallback: ADMIN_SECRET_KEY for development/testing
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  if (!adminSecret || token !== adminSecret) {
    return c.json({ error: 'Forbidden — invalid admin credentials' }, 403);
  }
  c.set('adminId', 'secret-key');
  c.set('adminEmail', 'admin@local');
  await next();
};

// ── Setup key auth middleware ──
// Used ONLY for first-time admin bootstrap. Protected by ADMIN_SECRET_KEY
// because no admin exists yet to use Firebase token auth.
const setupKeyAuth = async (c: AppContext, next: () => Promise<void>) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized — missing setup key' }, 401);
  }

  const token = authHeader.slice(7);
  const adminSecret = process.env.ADMIN_SECRET_KEY;

  if (!adminSecret) {
    return c.json({
      error: 'Server not configured',
      detail: 'ADMIN_SECRET_KEY environment variable is not set on the server. Set it to enable admin bootstrap.'
    }, 500);
  }

  if (token !== adminSecret) {
    return c.json({ error: 'Forbidden — invalid setup key' }, 403);
  }

  c.set('adminId', 'setup');
  c.set('adminEmail', 'setup@bootstrap');
  await next();
};

// ── User auth middleware ──
// Verifies a Firebase ID token for a regular (non-admin) user.
// Stores uid + email in context for subscription operations.
const userAuth = async (c: AppContext, next: () => Promise<void>) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized — please sign in' }, 401);
  }
  const token = authHeader.slice(7);

  try {
    const { adminAuth: firebaseAdminAuth } = await import('../lib/firebase-admin').catch(() => ({ adminAuth: null }));
    if (!firebaseAdminAuth) {
      return c.json({ error: 'Server not configured for auth', detail: 'Firebase Admin SDK unavailable' }, 500);
    }
    const decoded = await firebaseAdminAuth.verifyIdToken(token);
    c.set('userId', decoded.uid);
    c.set('userEmail', decoded.email || '');
    await next();
    return;
  } catch (error: any) {
    return c.json({ error: 'Unauthorized — invalid or expired token', detail: error?.message || 'verify failed' }, 401);
  }
};

// ── Helper: get or create Stripe customer for a Firebase user ──
async function getOrCreateStripeCustomer(stripe: Stripe, uid: string, email: string): Promise<string> {
  // Look up existing customer by metadata firebaseUid
  const existing = await stripe.customers.list({
    limit: 1,
    email,
    expand: ['data'],
  });
  for (const c of existing.data) {
    if (c.metadata?.firebaseUid === uid) return c.id;
  }
  const customer = await stripe.customers.create({
    email,
    metadata: { firebaseUid: uid },
  });
  return customer.id;
}

// ── Helper: write subscription status to Firestore via admin SDK ──
async function syncUserSubscriptionToFirestore(
  uid: string,
  data: {
    subscriptionStatus: 'free' | 'premium' | 'trial';
    subscriptionType?: 'monthly' | 'yearly' | null;
    subscriptionEndsAt?: Date | null;
    trialEndsAt?: Date | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    cancelAtPeriodEnd?: boolean;
  }
) {
  const { adminFirestore } = await import('../lib/firebase-admin').catch(() => ({ adminFirestore: null }));
  if (!adminFirestore) return;
  const admin = await import('firebase-admin');
  const userRef = adminFirestore.collection('users').doc(uid);
  const update: Record<string, any> = {
    subscriptionStatus: data.subscriptionStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (data.subscriptionType !== undefined) update.subscriptionType = data.subscriptionType ?? null;
  if (data.subscriptionEndsAt !== undefined) {
    update.subscriptionEndsAt = data.subscriptionEndsAt ? admin.firestore.Timestamp.fromDate(data.subscriptionEndsAt) : null;
  }
  if (data.trialEndsAt !== undefined) {
    update.trialEndsAt = data.trialEndsAt ? admin.firestore.Timestamp.fromDate(data.trialEndsAt) : null;
  }
  if (data.stripeCustomerId !== undefined) update.stripeCustomerId = data.stripeCustomerId ?? null;
  if (data.stripeSubscriptionId !== undefined) update.stripeSubscriptionId = data.stripeSubscriptionId ?? null;
  if (data.cancelAtPeriodEnd !== undefined) update.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
  await userRef.set(update, { merge: true }).catch((e: any) => {
    console.error('Failed to sync subscription to Firestore:', e?.message || e);
  });
}

// ── Helper: map a Stripe subscription to internal status ──
function mapStripeSubscriptionToStatus(sub: Stripe.Subscription): {
  subscriptionStatus: 'free' | 'premium' | 'trial';
  subscriptionType: 'monthly' | 'yearly' | null;
  subscriptionEndsAt: Date | null;
  trialEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
} {
  const priceId = sub.items.data[0]?.price?.id || '';
  const isYearly = process.env.STRIPE_PRICE_YEARLY === priceId;
  const isMonthly = process.env.STRIPE_PRICE_MONTHLY === priceId;
  const subscriptionType: 'monthly' | 'yearly' | null = isYearly ? 'yearly' : isMonthly ? 'monthly' : null;

  // Trial detection
  const isTrial = sub.status === 'trialing';
  const trialEndsAt = isTrial && sub.trial_end ? new Date(sub.trial_end * 1000) : null;
  // current_period_end moved to subscription items in Stripe API v22
  const currentPeriodEnd = sub.items?.data?.[0]?.current_period_end;
  const subscriptionEndsAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;

  // Active or trialing → premium/trial; otherwise free
  let subscriptionStatus: 'free' | 'premium' | 'trial' = 'free';
  if (sub.status === 'active') subscriptionStatus = 'premium';
  else if (sub.status === 'trialing') subscriptionStatus = 'trial';
  // past_due / canceled / unpaid → free (grace period handled by Stripe)

  return { subscriptionStatus, subscriptionType, subscriptionEndsAt, trialEndsAt, cancelAtPeriodEnd: sub.cancel_at_period_end };
}

// ── Validation helper ──
const validateBody = (schema: any) => async (c: AppContext, next: () => Promise<void>) => {
  try {
    const body = await c.req.json();
    const parsed = schema.parse(body);
    c.set('validatedBody', parsed);
    await next();
  } catch (error: any) {
    return c.json({
      error: 'Validation failed',
      details: error.issues || error.message,
    }, 400);
  }
};

const app = new Hono<{ Variables: AppVariables }>();

app.use('*', cors());

// ── Health ──
app.get('/', (c) => c.json({ status: 'ok', message: 'HarmonyFrequency API v3', timestamp: new Date().toISOString() }));

// ── Public read endpoint ──
app.get('/data', async (c) => {
  const store = await ensureStore();
  return c.json({
    frequencies: store.frequencies,
    curatedPrograms: store.curatedPrograms,
    articles: store.articles,
  });
});

// ── Admin: Data reset ──
app.post('/data/reset', adminAuth, async (c) => {
  const seed = getSeedData();
  await writeStore({
    frequencies: seed.frequencies,
    curatedPrograms: seed.sessions,
    articles: seed.articles,
  });
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'reset',
    resource: 'data',
    resourceId: 'all',
    changes: { frequencies: seed.frequencies.length, curatedPrograms: seed.sessions.length, articles: seed.articles.length },
  });
  return c.json({ ok: true, message: 'Seed data restored' });
});

// ── Admin: Frequencies CRUD ──
app.post('/frequencies', adminAuth, validateBody(createFrequencySchema), async (c) => {
  const payload = c.get('validatedBody') as any;
  const store = await ensureStore();
  const newFrequency: Frequency = { ...payload, id: `custom-${Date.now()}` };
  store.frequencies.push(newFrequency);
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'create',
    resource: 'frequency',
    resourceId: newFrequency.id,
    changes: { name: newFrequency.name, hz: newFrequency.hz },
  });
  return c.json(newFrequency, 201);
});

app.patch('/frequencies/:id', adminAuth, validateBody(updateFrequencySchema), async (c) => {
  const payload = c.get('validatedBody') as any;
  const id = c.req.param('id');
  const store = await ensureStore();
  const existing = store.frequencies.find((item) => item.id === id);
  if (!existing) {
    return c.json({ error: 'Frequency not found' }, 404);
  }
  const previousState = { name: existing.name, hz: existing.hz, category: existing.category };
  store.frequencies = store.frequencies.map((item) =>
    item.id === id ? { ...item, ...payload } : item
  );
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'update',
    resource: 'frequency',
    resourceId: id,
    changes: payload,
    previousState,
  });
  return c.json({ ok: true });
});

app.delete('/frequencies/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  const store = await ensureStore();
  const existing = store.frequencies.find((item) => item.id === id);
  if (!existing) {
    return c.json({ error: 'Frequency not found' }, 404);
  }
  store.frequencies = store.frequencies.filter((item) => item.id !== id);
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'delete',
    resource: 'frequency',
    resourceId: id,
    previousState: { name: existing.name, hz: existing.hz },
  });
  return c.json({ ok: true });
});

// ── Admin: Curated Programs CRUD ──
app.post('/curated-programs', adminAuth, validateBody(createCuratedProgramSchema), async (c) => {
  const payload = c.get('validatedBody') as any;
  const store = await ensureStore();
  const newProgram: CuratedProgram = {
    ...payload,
    id: `program-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.curatedPrograms.push(newProgram);
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'create',
    resource: 'curatedProgram',
    resourceId: newProgram.id,
    changes: { name: newProgram.name, category: newProgram.category },
  });
  return c.json(newProgram, 201);
});

app.patch('/curated-programs/:id', adminAuth, validateBody(updateCuratedProgramSchema), async (c) => {
  const payload = c.get('validatedBody') as any;
  const id = c.req.param('id');
  const store = await ensureStore();
  const existing = store.curatedPrograms.find((item) => item.id === id);
  if (!existing) {
    return c.json({ error: 'Curated program not found' }, 404);
  }
  store.curatedPrograms = store.curatedPrograms.map((item) =>
    item.id === id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item
  );
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'update',
    resource: 'curatedProgram',
    resourceId: id,
    changes: payload,
    previousState: { name: existing.name },
  });
  return c.json({ ok: true });
});

app.delete('/curated-programs/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  const store = await ensureStore();
  const existing = store.curatedPrograms.find((item) => item.id === id);
  if (!existing) {
    return c.json({ error: 'Curated program not found' }, 404);
  }
  store.curatedPrograms = store.curatedPrograms.filter((item) => item.id !== id);
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'delete',
    resource: 'curatedProgram',
    resourceId: id,
    previousState: { name: existing.name },
  });
  return c.json({ ok: true });
});

// ── Admin: Articles CRUD ──
app.post('/articles', adminAuth, validateBody(createArticleSchema), async (c) => {
  const payload = c.get('validatedBody') as any;
  const store = await ensureStore();
  const newArticle: LearningArticle = {
    ...payload,
    id: `article-${Date.now()}`,
    publishedAt: new Date().toISOString(),
  };
  store.articles.push(newArticle);
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'create',
    resource: 'article',
    resourceId: newArticle.id,
    changes: { title: newArticle.title, category: newArticle.category },
  });
  return c.json(newArticle, 201);
});

app.patch('/articles/:id', adminAuth, validateBody(updateArticleSchema), async (c) => {
  const payload = c.get('validatedBody') as any;
  const id = c.req.param('id');
  const store = await ensureStore();
  const existing = store.articles.find((item) => item.id === id);
  if (!existing) {
    return c.json({ error: 'Article not found' }, 404);
  }
  store.articles = store.articles.map((item) =>
    item.id === id ? { ...item, ...payload } : item
  );
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'update',
    resource: 'article',
    resourceId: id,
    changes: payload,
    previousState: { title: existing.title },
  });
  return c.json({ ok: true });
});

app.delete('/articles/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  const store = await ensureStore();
  const existing = store.articles.find((item) => item.id === id);
  if (!existing) {
    return c.json({ error: 'Article not found' }, 404);
  }
  store.articles = store.articles.filter((item) => item.id !== id);
  await writeStore(store);
  await writeAuditLog({
    adminId: c.get('adminId'),
    adminEmail: c.get('adminEmail'),
    action: 'delete',
    resource: 'article',
    resourceId: id,
    previousState: { title: existing.title },
  });
  return c.json({ ok: true });
});

// ── Admin: Audit log view ──
app.get('/audit', adminAuth, async (c) => {
  const logs = await loadAuditLogs();
  const limit = parseInt(c.req.query('limit') || '100');
  return c.json(logs.slice(-limit).reverse());
});

// ── Admin: Live Analytics (reads Firebase Firestore directly) ──
app.get('/admin/analytics', adminAuth, async (c) => {
  try {
    const { adminService } = await import('../lib/firebase-admin').catch(() => ({ adminService: null }));
    if (!adminService) {
      return c.json({ error: 'Firebase Admin SDK not available' }, 503);
    }
    const db = adminService.getDb();
    const [usersSnap, freqSnap, programsSnap, articlesSnap, sessionsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('frequencies').get(),
      db.collection('curatedPrograms').get(),
      db.collection('articles').get(),
      db.collection('sessions').get().catch(() => ({ docs: [] })),
    ]);

    const allUsers = usersSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    const premiumUsers = allUsers.filter((u: any) => u.subscriptionStatus === 'premium');
    const trialUsers = allUsers.filter((u: any) => u.subscriptionStatus === 'trial');
    const freeUsers = allUsers.filter((u: any) => !u.subscriptionStatus || u.subscriptionStatus === 'free');

    // Aggregate listening time across all users
    const totalListeningMinutes = allUsers.reduce((sum: number, u: any) =>
      sum + (u.usageStats?.totalListeningTime || 0), 0);
    const totalSessionsCompleted = allUsers.reduce((sum: number, u: any) =>
      sum + (u.usageStats?.sessionsCompleted || 0), 0);
    const totalStreakDays = allUsers.reduce((max: number, u: any) =>
      Math.max(max, u.usageStats?.streakDays || 0), 0);

    // Recent users (last 10 by createdAt)
    const recentUsers = allUsers
      .map((u: any) => ({
        id: u.id,
        email: u.email || 'Unknown',
        displayName: u.displayName || undefined,
        subscriptionStatus: u.subscriptionStatus || 'free',
        createdAt: u.createdAt,
        sessionsCompleted: u.usageStats?.sessionsCompleted || 0,
        streakDays: u.usageStats?.streakDays || 0,
      }))
      .sort((a: any, b: any) => {
        const aD = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(0);
        const bD = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(0);
        return bD.getTime() - aD.getTime();
      })
      .slice(0, 10);

    // Sessions from the sessions collection (if any)
    const allSessions = sessionsSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));

    // Revenue estimate (monthly recurring)
    const monthlyRevenue = premiumUsers.length * 9.99;
    const yearlyRevenue = premiumUsers.length * 95.99;

    return c.json({
      users: {
        total: allUsers.length,
        premium: premiumUsers.length,
        trial: trialUsers.length,
        free: freeUsers.length,
      },
      content: {
        frequencies: freqSnap.size,
        curatedPrograms: programsSnap.size,
        articles: articlesSnap.size,
      },
      engagement: {
        totalListeningMinutes,
        totalSessionsCompleted,
        topStreakDays: totalStreakDays,
        activeSessions: allSessions.length,
      },
      revenue: {
        monthlyEstimate: parseFloat(monthlyRevenue.toFixed(2)),
        yearlyEstimate: parseFloat(yearlyRevenue.toFixed(2)),
      },
      recentUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Analytics endpoint error:', error);
    return c.json({ error: 'Failed to fetch analytics', detail: error?.message }, 500);
  }
});

// ═══════════════════════════════════════════
// ── Admin Account Management ──
// ═══════════════════════════════════════════

// Health check: is firebase-admin configured?
app.get('/admin/status', async (c) => {
  try {
    const { adminAuth: fa } = await import('../lib/firebase-admin').catch(() => ({ adminAuth: null }));
    const hasFirebaseAdmin = !!fa;
    const hasSetupKey = !!process.env.ADMIN_SECRET_KEY;

    return c.json({
      firebaseAdminAvailable: hasFirebaseAdmin,
      canBootstrapAdmin: hasSetupKey && hasFirebaseAdmin,
      message: hasFirebaseAdmin
        ? 'Firebase Admin SDK is configured. Ready to manage admin accounts.'
        : 'Firebase Admin SDK is NOT configured. Set FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY to enable admin management.'
    });
  } catch {
    return c.json({
      firebaseAdminAvailable: false,
      canBootstrapAdmin: false,
      message: 'Firebase Admin SDK initialization failed. Check FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY format.'
    });
  }
});

/**
 * POST /admin/setup
 * Bootstrap the FIRST admin account.
 * Protected by ADMIN_SECRET_KEY (not Firebase claims — no admin exists yet).
 * 
 * Body: { email: string }
 * 
 * Sets the Firebase custom claim { admin: true } on the user identified by email.
 * After this endpoint succeeds, the user MUST sign out and sign back in
 * to receive a fresh ID token with the admin claim.
 */
app.post('/admin/setup', setupKeyAuth, async (c) => {
  let body: { email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || email.length > 100 || !email.includes('@')) {
    return c.json({ error: 'A valid email address is required' }, 400);
  }

  // Dynamically import firebase-admin (only available server-side)
  const { adminService } = await import('../lib/firebase-admin').catch(() => {
    throw new Error('Firebase Admin SDK not available');
  });

  try {
    const result = await adminService.makeUserAdmin(email);

    await writeAuditLog({
      adminId: 'setup',
      adminEmail: 'setup@bootstrap',
      action: 'create',
      resource: 'adminClaim',
      resourceId: result.user.uid,
      changes: { email: result.user.email, claim: 'admin' },
    });

    return c.json({
      success: true,
      message: `Admin claim set for ${email}. The user MUST sign out and sign back in for the claim to take effect.`,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        isAdmin: true,
      },
      nextStep: 'Sign out of the app and sign back in. The admin claim is embedded in your ID token and only refreshes on new sign-in.',
    });
  } catch (error: any) {
    if (error?.code === 'auth/user-not-found') {
      return c.json({
        error: 'User not found',
        detail: `No Firebase Auth user found with email: ${email}. Create the account first (sign up in the app with this email), then try again.`
      }, 404);
    }
    console.error('Admin setup error:', error);
    return c.json({
      error: 'Failed to set admin claim',
      detail: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * POST /admin/users/:uid/claims
 * Manage custom claims for any user. Requires Firebase admin auth.
 * 
 * Body: { claims: Record<string, any> }
 * 
 * Merges the provided claims with existing claims.
 * Set a claim to null to remove it.
 */
app.post('/admin/users/:uid/claims', adminAuth, async (c) => {
  const uid = c.req.param('uid');
  if (!uid?.trim()) {
    return c.json({ error: 'User ID is required' }, 400);
  }

  let body: { claims?: Record<string, any> };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.claims || typeof body.claims !== 'object' || Object.keys(body.claims).length === 0) {
    return c.json({ error: 'claims object is required' }, 400);
  }

  const { adminService } = await import('../lib/firebase-admin').catch(() => {
    throw new Error('Firebase Admin SDK not available');
  });

  try {
    const result = await adminService.setCustomClaims(uid, body.claims);

    await writeAuditLog({
      adminId: c.get('adminId'),
      adminEmail: c.get('adminEmail'),
      action: 'update',
      resource: 'adminClaim',
      resourceId: uid,
      changes: body.claims,
    });

    return c.json({
      success: true,
      uid: result.uid,
      claims: result.claims,
      message: 'Claims updated. The affected user must sign out and sign back in for new claims to take effect.'
    });
  } catch (error: any) {
    console.error('Claims update error:', error);
    return c.json({
      error: 'Failed to update claims',
      detail: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * GET /admin/users/:email/claims
 * Read custom claims for a user by email. Requires Firebase admin auth.
 */
app.get('/admin/users/:email/claims', adminAuth, async (c) => {
  const email = c.req.param('email')?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return c.json({ error: 'A valid email is required' }, 400);
  }

  const { adminService } = await import('../lib/firebase-admin').catch(() => {
    throw new Error('Firebase Admin SDK not available');
  });

  try {
    const userRecord = await adminService.getUserByEmail(email);
    return c.json({
      uid: userRecord.uid,
      email: userRecord.email,
      customClaims: userRecord.customClaims || {},
      isAdmin: userRecord.customClaims?.admin === true,
    });
  } catch (error: any) {
    if (error?.code === 'auth/user-not-found') {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({
      error: 'Failed to fetch user claims',
      detail: error?.message || 'Unknown error'
    }, 500);
  }
});

// ═══════════════════════════════════════════
// ── Subscription / Billing (Stripe) ──
// ═══════════════════════════════════════════

/**
 * GET /api/subscription/status
 * Returns the server-verified subscription entitlement for the signed-in user.
 */
app.get('/api/subscription/status', userAuth, async (c) => {
  const uid = c.get('userId');
  const email = c.get('userEmail');

  if (!isStripeConfigured()) {
    // Stripe not configured — fall back to reading Firestore profile
    try {
      const { adminFirestore } = await import('../lib/firebase-admin').catch(() => ({ adminFirestore: null }));
      if (adminFirestore) {
        const snap = await adminFirestore.collection('users').doc(uid).get();
        const data = snap.data() || {};
        const status = data.subscriptionStatus || 'free';
        const trialEndsAt = data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : null;
        const subscriptionEndsAt = data.subscriptionEndsAt?.toDate ? data.subscriptionEndsAt.toDate() : null;
        const isTrialActive = status === 'trial' && trialEndsAt && new Date() < trialEndsAt;
        const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : 0;
        return c.json({
          isPremium: status === 'premium',
          isTrialActive,
          trialDaysLeft,
          subscriptionStatus: status,
          subscriptionType: data.subscriptionType || undefined,
          subscriptionEndsAt: subscriptionEndsAt?.toISOString(),
          trialEndsAt: trialEndsAt?.toISOString(),
          willRenew: !data.cancelAtPeriodEnd,
          cancelAtPeriodEnd: !!data.cancelAtPeriodEnd,
        });
      }
    } catch (e: any) {
      console.warn('Subscription status fallback failed:', e?.message || e);
    }
    return c.json({
      isPremium: false,
      isTrialActive: false,
      trialDaysLeft: 0,
      subscriptionStatus: 'free',
      willRenew: false,
      cancelAtPeriodEnd: false,
      message: 'Stripe is not configured on the server. Set STRIPE_SECRET_KEY to enable subscriptions.',
    });
  }

  try {
    const stripe = getStripe();
    // Find customer by firebaseUid
    const customers = await stripe.customers.list({ limit: 100, email });
    const customer = customers.data.find((cust) => cust.metadata?.firebaseUid === uid);
    if (!customer) {
      return c.json({
        isPremium: false,
        isTrialActive: false,
        trialDaysLeft: 0,
        subscriptionStatus: 'free',
        willRenew: false,
        cancelAtPeriodEnd: false,
      });
    }

    const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5, status: 'all' });
    const activeSub = subs.data.find((s) => s.status === 'active' || s.status === 'trialing') || null;

    if (!activeSub) {
      return c.json({
        isPremium: false,
        isTrialActive: false,
        trialDaysLeft: 0,
        subscriptionStatus: 'free',
        willRenew: false,
        cancelAtPeriodEnd: false,
        stripeCustomerId: customer.id,
      });
    }

    const status = mapStripeSubscriptionToStatus(activeSub);
    const trialDaysLeft = status.trialEndsAt ? Math.max(0, Math.ceil((status.trialEndsAt.getTime() - Date.now()) / 86400000)) : 0;

    return c.json({
      isPremium: status.subscriptionStatus === 'premium',
      isTrialActive: status.subscriptionStatus === 'trial',
      trialDaysLeft,
      subscriptionStatus: status.subscriptionStatus,
      subscriptionType: status.subscriptionType || undefined,
      subscriptionEndsAt: status.subscriptionEndsAt?.toISOString(),
      trialEndsAt: status.trialEndsAt?.toISOString(),
      willRenew: !status.cancelAtPeriodEnd,
      cancelAtPeriodEnd: status.cancelAtPeriodEnd,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: activeSub.id,
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return c.json({ error: 'Failed to fetch subscription status', detail: error?.message || 'Unknown error' }, 500);
  }
});

/**
 * POST /api/subscription/checkout
 * Body: { plan: 'monthly' | 'yearly', trialEnabled?: boolean }
 * Returns: { url: string } — Stripe Checkout URL to redirect the user to.
 */
app.post('/api/subscription/checkout', userAuth, async (c) => {
  const uid = c.get('userId');
  const email = c.get('userEmail');

  if (!isStripeConfigured()) {
    return c.json({ error: 'Subscriptions not configured', detail: 'STRIPE_SECRET_KEY is not set on the server.' }, 503);
  }

  let body: { plan?: 'monthly' | 'yearly'; trialEnabled?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const plan = body.plan;
  if (plan !== 'monthly' && plan !== 'yearly') {
    return c.json({ error: 'Invalid plan. Must be "monthly" or "yearly".' }, 400);
  }

  const trialEnabled = body.trialEnabled !== false; // default true

  // Frontend URL for redirects (must be set in Stripe dashboard as allowed)
  const appUrl = process.env.EXPO_PUBLIC_APP_URL || process.env.EXPO_PUBLIC_RORK_APP_URL || 'https://ctm3aav51lzn5l4xdanzg-expo.rork.live';

  try {
    const stripe = getStripe();
    const customerId = await getOrCreateStripeCustomer(stripe, uid, email);
    const priceId = SUBSCRIPTION_PLANS[plan].priceId();
    const trialDays = trialEnabled ? SUBSCRIPTION_PLANS[plan].trialDays : 0;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?subscription=cancelled`,
      client_reference_id: uid,
      metadata: { firebaseUid: uid, plan },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    if (trialEnabled && trialDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: trialDays,
        metadata: { firebaseUid: uid, plan },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await writeAuditLog({
      adminId: uid,
      adminEmail: email,
      action: 'create',
      resource: 'subscription',
      resourceId: session.id,
      changes: { plan, trialEnabled, customerId },
    });

    return c.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return c.json({ error: 'Failed to create checkout session', detail: error?.message || 'Unknown error' }, 500);
  }
});

/**
 * POST /api/subscription/portal
 * Returns: { url: string } — Stripe Customer Portal URL for managing the subscription.
 */
app.post('/api/subscription/portal', userAuth, async (c) => {
  const uid = c.get('userId');
  const email = c.get('userEmail');

  if (!isStripeConfigured()) {
    return c.json({ error: 'Subscriptions not configured' }, 503);
  }

  const appUrl = process.env.EXPO_PUBLIC_APP_URL || process.env.EXPO_PUBLIC_RORK_APP_URL || 'https://ctm3aav51lzn5l4xdanzg-expo.rork.live';

  try {
    const stripe = getStripe();
    const customerId = await getOrCreateStripeCustomer(stripe, uid, email);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: appUrl,
    });
    return c.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal session error:', error);
    return c.json({ error: 'Failed to create billing portal session', detail: error?.message || 'Unknown error' }, 500);
  }
});

/**
 * POST /api/subscription/cancel
 * Cancels the active subscription at period end (user keeps access until period ends).
 */
app.post('/api/subscription/cancel', userAuth, async (c) => {
  const uid = c.get('userId');
  const email = c.get('userEmail');

  if (!isStripeConfigured()) {
    return c.json({ error: 'Subscriptions not configured' }, 503);
  }

  try {
    const stripe = getStripe();
    const customers = await stripe.customers.list({ limit: 100, email });
    const customer = customers.data.find((cust) => cust.metadata?.firebaseUid === uid);
    if (!customer) return c.json({ error: 'No subscription found' }, 404);

    const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5, status: 'all' });
    const activeSub = subs.data.find((s) => s.status === 'active' || s.status === 'trialing');
    if (!activeSub) return c.json({ error: 'No active subscription found' }, 404);

    const updated = await stripe.subscriptions.update(activeSub.id, { cancel_at_period_end: true });

    await syncUserSubscriptionToFirestore(uid, {
      subscriptionStatus: mapStripeSubscriptionToStatus(updated).subscriptionStatus,
      subscriptionType: mapStripeSubscriptionToStatus(updated).subscriptionType,
      subscriptionEndsAt: mapStripeSubscriptionToStatus(updated).subscriptionEndsAt,
      trialEndsAt: mapStripeSubscriptionToStatus(updated).trialEndsAt,
      cancelAtPeriodEnd: true,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: updated.id,
    });

    await writeAuditLog({
      adminId: uid,
      adminEmail: email,
      action: 'cancel',
      resource: 'subscription',
      resourceId: updated.id,
      changes: { cancelAtPeriodEnd: true },
    });

    return c.json({ success: true, cancelAtPeriodEnd: true });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return c.json({ error: 'Failed to cancel subscription', detail: error?.message || 'Unknown error' }, 500);
  }
});

/**
 * POST /api/subscription/resume
 * Removes the cancellation flag so the subscription continues to renew.
 */
app.post('/api/subscription/resume', userAuth, async (c) => {
  const uid = c.get('userId');
  const email = c.get('userEmail');

  if (!isStripeConfigured()) {
    return c.json({ error: 'Subscriptions not configured' }, 503);
  }

  try {
    const stripe = getStripe();
    const customers = await stripe.customers.list({ limit: 100, email });
    const customer = customers.data.find((cust) => cust.metadata?.firebaseUid === uid);
    if (!customer) return c.json({ error: 'No subscription found' }, 404);

    const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5, status: 'all' });
    const activeSub = subs.data.find((s) => s.status === 'active' || s.status === 'trialing');
    if (!activeSub) return c.json({ error: 'No active subscription found' }, 404);

    const updated = await stripe.subscriptions.update(activeSub.id, { cancel_at_period_end: false });

    await syncUserSubscriptionToFirestore(uid, {
      subscriptionStatus: mapStripeSubscriptionToStatus(updated).subscriptionStatus,
      subscriptionType: mapStripeSubscriptionToStatus(updated).subscriptionType,
      subscriptionEndsAt: mapStripeSubscriptionToStatus(updated).subscriptionEndsAt,
      trialEndsAt: mapStripeSubscriptionToStatus(updated).trialEndsAt,
      cancelAtPeriodEnd: false,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: updated.id,
    });

    return c.json({ success: true, cancelAtPeriodEnd: false });
  } catch (error: any) {
    console.error('Resume subscription error:', error);
    return c.json({ error: 'Failed to resume subscription', detail: error?.message || 'Unknown error' }, 500);
  }
});

/**
 * POST /api/webhook
 * Stripe webhook receiver. Verifies the signature, then syncs subscription
 * status to Firestore. This is the ONLY place subscription fields get written —
 * never trust the client.
 *
 * Configure this URL in the Stripe Dashboard → Webhooks.
 */
app.post('/api/webhook', async (c) => {
  if (!isStripeConfigured()) {
    return c.json({ error: 'Webhook receiver not configured' }, 503);
  }

  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  const rawBody = await c.req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message || err);
    return c.json({ error: `Webhook signature verification failed: ${err?.message}` }, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.firebaseUid || session.client_reference_id || '';
        const plan = (session.metadata?.plan as 'monthly' | 'yearly') || null;
        if (uid) {
          // Fetch the actual subscription to determine trial vs active status
          // accurately from the start (customer.subscription.* events will refine).
          let initialStatus: 'free' | 'premium' | 'trial' = 'premium';
          let subscriptionEndsAt: Date | null = null;
          let trialEndsAt: Date | null = null;
          let cancelAtPeriodEnd = false;
          try {
            const stripe = getStripe();
            if (session.subscription && typeof session.subscription === 'string') {
              const sub = await stripe.subscriptions.retrieve(session.subscription);
              const mapped = mapStripeSubscriptionToStatus(sub);
              initialStatus = mapped.subscriptionStatus;
              subscriptionEndsAt = mapped.subscriptionEndsAt;
              trialEndsAt = mapped.trialEndsAt;
              cancelAtPeriodEnd = mapped.cancelAtPeriodEnd;
            }
          } catch (subErr: any) {
            console.warn('checkout.session.completed: failed to fetch subscription, defaulting to premium:', subErr?.message || subErr);
          }
          await syncUserSubscriptionToFirestore(uid, {
            subscriptionStatus: initialStatus,
            subscriptionType: plan,
            subscriptionEndsAt,
            trialEndsAt,
            cancelAtPeriodEnd,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        let uid = sub.metadata?.firebaseUid || '';
        if (!uid) {
          // Try to resolve uid from customer metadata
          const stripe = getStripe();
          const customer = await stripe.customers.retrieve(sub.customer as string).catch(() => null);
          if (customer && !('deleted' in customer) && customer.metadata?.firebaseUid) {
            uid = customer.metadata.firebaseUid;
            await syncUserSubscriptionToFirestore(uid, {
              ...mapStripeSubscriptionToStatus(sub),
              stripeCustomerId: sub.customer as string,
              stripeSubscriptionId: sub.id,
            });
          }
        } else {
          await syncUserSubscriptionToFirestore(uid, {
            ...mapStripeSubscriptionToStatus(sub),
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        let resolvedUid = sub.metadata?.firebaseUid || '';
        if (!resolvedUid) {
          const stripe = getStripe();
          const customer = await stripe.customers.retrieve(sub.customer as string).catch(() => null);
          if (customer && !('deleted' in customer) && customer.metadata?.firebaseUid) {
            resolvedUid = customer.metadata.firebaseUid;
          }
        }
        if (resolvedUid) {
          await syncUserSubscriptionToFirestore(resolvedUid, {
            subscriptionStatus: 'free',
            subscriptionType: null,
            subscriptionEndsAt: null,
            trialEndsAt: null,
            cancelAtPeriodEnd: false,
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: null,
          });
        }
        break;
      }
      default:
        // Unhandled event — log but don't error
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error?.message || error);
    return c.json({ error: 'Webhook handler failed' }, 500);
  }
});

export default app;
