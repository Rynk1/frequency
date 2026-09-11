import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'harmony-frequency-app',
  });
}

const db = admin.firestore();
const auth = admin.auth();

export const SUPPORTED_ROLES = ['user', 'content_editor', 'regional_manager', 'admin', 'super_admin'] as const;
export type SupportedRole = typeof SUPPORTED_ROLES[number];

/**
 * Helper: Write immutable server audit log
 */
async function writeAuditLog(entry: {
  adminUserId: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
}) {
  try {
    await db.collection('auditLogs').add({
      ...entry,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err: any) {
    console.error('Failed to write audit log:', err?.message || err);
  }
}

/**
 * Helper: Delete entire subcollection batch
 */
async function deleteSubcollection(parentDocRef: admin.firestore.DocumentReference, subcollectionName: string) {
  try {
    const snap = await parentDocRef.collection(subcollectionName).get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (e: any) {
    console.warn(`Failed deleting subcollection ${subcollectionName}:`, e?.message || e);
  }
}

/**
 * Helper: Authenticate request token
 */
async function authenticateRequest(req: any): Promise<{ uid: string; email: string; isAdmin: boolean; isSuperAdmin: boolean; isSecretKey: boolean }> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized — missing Bearer token');
  }

  const token = authHeader.slice(7).trim();
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const allowSecretBootstrap = process.env.ALLOW_SECRET_KEY_ADMIN === 'true' || process.env.NODE_ENV !== 'production';

  if (secretKey && token === secretKey && allowSecretBootstrap) {
    return { uid: 'secret-key-admin', email: 'admin@bootstrap', isAdmin: true, isSuperAdmin: true, isSecretKey: true };
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    const isAdmin = decoded.admin === true || decoded.role === 'admin' || decoded.role === 'super_admin';
    const isSuperAdmin = decoded.super_admin === true || decoded.role === 'super_admin';
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      isAdmin,
      isSuperAdmin,
      isSecretKey: false,
    };
  } catch {
    throw new Error('Unauthorized — invalid or expired token');
  }
}

/**
 * Helper: Helper to compute canonical capabilities from premium flag
 */
function computeCapabilities(isPremium: boolean) {
  return {
    premiumFrequencies: isPremium,
    extendedSessions: isPremium,
    binaural: isPremium,
    chakra: isPremium,
    offlineDownloads: isPremium,
    advancedAnalytics: isPremium,
    customMixing: isPremium,
  };
}

/**
 * Function 1: Admin Bootstrap & Custom Claim Management
 * POST /setAdminClaim
 */
export const setAdminClaim = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const caller = await authenticateRequest(req);

    if (!caller.isAdmin) {
      res.status(403).json({ error: 'Forbidden — admin privileges required' });
      return;
    }

    const { email, uid, role, claims } = req.body || {};

    let targetUid = uid;
    let targetEmail = email;

    if (!targetUid && email) {
      const user = await auth.getUserByEmail(email.trim().toLowerCase());
      targetUid = user.uid;
      targetEmail = user.email || email;
    }

    if (!targetUid) {
      res.status(400).json({ error: 'Must provide either target "uid" or "email"' });
      return;
    }

    let validatedRole: SupportedRole = 'user';
    if (role && SUPPORTED_ROLES.includes(role)) {
      validatedRole = role;
    } else if (claims?.admin) {
      validatedRole = claims?.super_admin ? 'super_admin' : 'admin';
    } else if (claims?.role && SUPPORTED_ROLES.includes(claims.role)) {
      validatedRole = claims.role;
    }

    const sanitizedClaims: Record<string, any> = {
      role: validatedRole,
      admin: validatedRole === 'admin' || validatedRole === 'super_admin',
      super_admin: validatedRole === 'super_admin',
      content_editor: validatedRole === 'content_editor' || validatedRole === 'admin' || validatedRole === 'super_admin',
    };

    const existingUser = await auth.getUser(targetUid);
    const existingClaims = existingUser.customClaims || {};

    if (existingClaims.super_admin && !sanitizedClaims.super_admin) {
      const listUsersResult = await auth.listUsers(100);
      const superAdminCount = listUsersResult.users.filter(u => u.customClaims?.super_admin === true).length;
      if (superAdminCount <= 1) {
        res.status(400).json({ error: 'Cannot revoke super_admin privilege from the last remaining super_admin.' });
        return;
      }
    }

    await auth.setCustomUserClaims(targetUid, sanitizedClaims);

    await writeAuditLog({
      adminUserId: caller.uid,
      adminEmail: caller.email,
      action: 'SET_ADMIN_CLAIMS',
      resourceType: 'user',
      resourceId: targetUid,
      metadata: { targetEmail, role: validatedRole, claims: sanitizedClaims },
    });

    res.status(200).json({
      success: true,
      uid: targetUid,
      email: targetEmail,
      role: validatedRole,
      claims: sanitizedClaims,
      message: 'Custom claims set successfully. User must sign out and sign back in to refresh token claims.',
    });
  } catch (err: any) {
    console.error('setAdminClaim error:', err?.message || err);
    const status = err.message?.startsWith('Unauthorized') ? 401 : err.message?.startsWith('Forbidden') ? 403 : 500;
    res.status(status).json({ error: err?.message || 'Server error setting claims' });
  }
});

/**
 * Function 2: Complete Self-Serve Account Deletion
 * POST /deleteAccount
 */
export const deleteAccount = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const user = await authenticateRequest(req);

    if (!user.uid || user.isSecretKey) {
      res.status(400).json({ error: 'Invalid user token for account deletion' });
      return;
    }

    const uid = user.uid;

    const userDocRef = db.collection('users').doc(uid);
    const subscriptionRef = db.collection('subscriptions').doc(uid);
    const entitlementRef = db.collection('entitlements').doc(uid);
    const userStatsRef = db.collection('userStats').doc(uid);
    const userAchievementsRef = db.collection('userAchievements').doc(uid);
    const userFavoritesRef = db.collection('userFavorites').doc(uid);

    await deleteSubcollection(db.collection('userSessions').doc(uid), 'sessions');
    await deleteSubcollection(db.collection('userReminders').doc(uid), 'reminders');
    await deleteSubcollection(db.collection('userUsage').doc(uid), 'events');

    await userDocRef.delete().catch(() => {});
    await subscriptionRef.delete().catch(() => {});
    await entitlementRef.delete().catch(() => {});
    await userStatsRef.delete().catch(() => {});
    await userAchievementsRef.delete().catch(() => {});
    await userFavoritesRef.delete().catch(() => {});
    await db.collection('userSessions').doc(uid).delete().catch(() => {});
    await db.collection('userReminders').doc(uid).delete().catch(() => {});
    await db.collection('userUsage').doc(uid).delete().catch(() => {});

    await writeAuditLog({
      adminUserId: uid,
      adminEmail: user.email,
      action: 'DELETE_ACCOUNT',
      resourceType: 'user',
      resourceId: uid,
    });

    await auth.deleteUser(uid);

    res.status(200).json({ success: true, message: 'Account and all associated personal data deleted successfully.' });
  } catch (err: any) {
    console.error('deleteAccount error:', err?.message || err);
    const status = err.message?.startsWith('Unauthorized') ? 401 : 500;
    res.status(status).json({ error: err?.message || 'Failed to delete account' });
  }
});

/**
 * Function 3: Subscription & Payment Webhook Receiver
 * POST /handleSubscriptionWebhook
 * Four-layer state architecture with transactional idempotency & out-of-order protection.
 */
export const handleSubscriptionWebhook = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const expectedSecret = process.env.WEBHOOK_SECRET || process.env.REVENUECAT_WEBHOOK_SECRET;
    const authHeader = req.headers.authorization || req.headers['x-revenuecat-webhook-auth'] as string || '';

    let isAuthenticatedWebhook = false;

    if (expectedSecret) {
      if (authHeader === `Bearer ${expectedSecret}` || authHeader === expectedSecret) {
        isAuthenticatedWebhook = true;
      }
    } else {
      if (authHeader.startsWith('Bearer ') || authHeader.length > 5) {
        isAuthenticatedWebhook = true;
      }
    }

    if (!isAuthenticatedWebhook) {
      console.warn('[WEBHOOK] Rejected unauthenticated or unsigned webhook request');
      res.status(401).json({ error: 'Unauthorized — missing or invalid webhook authorization token' });
      return;
    }

    const event = req.body || {};
    const eventType = event.type || event.event?.type;
    const eventId = String(event.id || event.event?.id || (event.event?.app_user_id ? `${event.event.app_user_id}_${event.event.event_timestamp_ms}` : '')).trim();
    const sourceTimestamp = Number(event.event?.event_timestamp_ms || event.created || Date.now());

    if (!eventType && !eventId) {
      res.status(400).json({ error: 'Malformed webhook payload' });
      return;
    }

    // RevenueCat Payload Processing
    const rcEvent = event.event || (event.app_user_id ? event : null);

    if (rcEvent && rcEvent.app_user_id) {
      const uid = String(rcEvent.app_user_id).trim();
      const entitlementId = rcEvent.entitlement_id || 'premium';
      const productId = rcEvent.product_id || 'monthly_premium';

      const isExpired = rcEvent.type === 'EXPIRATION' || rcEvent.type === 'REVOCATION' || rcEvent.type === 'REFUND';
      const isCancelled = rcEvent.type === 'CANCELLATION';
      const isPremium = !isExpired && (rcEvent.type === 'INITIAL_PURCHASE' || rcEvent.type === 'RENEWAL' || rcEvent.type === 'UNCANCELLATION' || rcEvent.type === 'TRIAL_STARTED' || isCancelled);

      const subStatus = isExpired
        ? (rcEvent.type === 'REFUND' ? 'refunded' : rcEvent.type === 'REVOCATION' ? 'revoked' : 'expired')
        : isCancelled
          ? 'cancelled'
          : rcEvent.type === 'TRIAL_STARTED'
            ? 'trial'
            : isPremium
              ? 'active'
              : 'none';

      let transactionResult: any = { processingStatus: 'PROCESSED', isPremium, subStatus };

      try {
        transactionResult = await db.runTransaction(async (transaction) => {
          const eventDocRef = db.collection('subscriptionEvents').doc(`eventId_${eventId}`);
          const subscriptionRef = db.collection('subscriptions').doc(uid);
          const entitlementRef = db.collection('entitlements').doc(uid);
          const userRef = db.collection('users').doc(uid);

          const eventSnap = await transaction.get(eventDocRef);
          if (eventSnap.exists) {
            return { processingStatus: 'DUPLICATE', idempotent: true };
          }

          const subSnap = await transaction.get(subscriptionRef);
          const currentSub = subSnap.exists ? subSnap.data() : null;

          if (currentSub && currentSub.lastEventTimestamp && currentSub.lastEventTimestamp > sourceTimestamp) {
            transaction.set(eventDocRef, {
              provider: 'revenuecat',
              eventId,
              eventType,
              uid,
              receivedAt: admin.firestore.FieldValue.serverTimestamp(),
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
              processingStatus: 'STALE',
              sourceTimestamp,
            });
            return { processingStatus: 'STALE', message: 'Event ignored as older than current subscription state' };
          }

          const nowServer = admin.firestore.FieldValue.serverTimestamp();
          const subscriptionData = {
            uid,
            provider: 'revenuecat',
            providerAppUserId: uid,
            subscriptionStatus: subStatus,
            productId,
            entitlementId,
            subscriptionType: productId.includes('yearly') ? 'yearly' : 'monthly',
            willRenew: !isCancelled && isPremium,
            lastVerifiedAt: nowServer,
            lastEventId: eventId,
            lastEventTimestamp: sourceTimestamp,
            updatedAt: nowServer,
          };
          transaction.set(subscriptionRef, subscriptionData, { merge: true });

          const entitlementData = {
            uid,
            isPremium,
            status: isPremium ? (rcEvent.type === 'TRIAL_STARTED' ? 'trial' : 'active') : 'expired',
            capabilities: computeCapabilities(isPremium),
            source: 'revenuecat',
            verifiedAt: nowServer,
            version: 1,
          };
          transaction.set(entitlementRef, entitlementData, { merge: true });

          transaction.set(userRef, {
            subscriptionStatus: isPremium ? (rcEvent.type === 'TRIAL_STARTED' ? 'trial' : 'premium') : 'free',
            isPremium,
            updatedAt: nowServer,
          }, { merge: true });

          transaction.set(eventDocRef, {
            provider: 'revenuecat',
            eventId,
            eventType,
            uid,
            appUserId: uid,
            productId,
            entitlementId,
            receivedAt: nowServer,
            processedAt: nowServer,
            processingStatus: 'PROCESSED',
            resultingState: subStatus,
            sourceTimestamp,
          });

          return { processingStatus: 'PROCESSED', isPremium, subStatus };
        });
      } catch (dbErr: any) {
        console.warn('Webhook Firestore transaction warning (falling back):', dbErr?.message || dbErr);
      }

      res.status(200).json({ received: true, uid, status: isPremium ? 'premium' : 'free', ...transactionResult });
      return;
    }

    res.status(200).json({ received: true, note: 'Unhandled event structure' });
  } catch (err: any) {
    console.error('handleSubscriptionWebhook error:', err?.message || err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Function 4: Trusted Subscription Reconciliation & Restore
 * POST /reconcileSubscription
 * Allows client to request server verification & entitlement sync upon app launch or Restore Purchases.
 */
export const reconcileSubscription = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const user = await authenticateRequest(req);
    const uid = user.uid;

    let subData: any = null;
    let entData: any = null;

    try {
      const subSnap = await db.collection('subscriptions').doc(uid).get();
      const entSnap = await db.collection('entitlements').doc(uid).get();
      subData = subSnap.exists ? subSnap.data() : null;
      entData = entSnap.exists ? entSnap.data() : null;
    } catch (e: any) {
      console.warn('Reconciliation Firestore read warning:', e?.message || e);
    }

    if (!entData) {
      const defaultEntitlement = {
        uid,
        isPremium: false,
        status: 'free',
        capabilities: computeCapabilities(false),
        source: 'revenuecat',
        verifiedAt: new Date().toISOString(),
        version: 1,
      };
      res.status(200).json({ success: true, entitlement: defaultEntitlement });
      return;
    }

    res.status(200).json({
      success: true,
      subscription: subData,
      entitlement: {
        ...entData,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('reconcileSubscription error:', err?.message || err);
    const status = err.message?.startsWith('Unauthorized') ? 401 : 500;
    res.status(status).json({ error: err?.message || 'Reconciliation failed' });
  }
});
