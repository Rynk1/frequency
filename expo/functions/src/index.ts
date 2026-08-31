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
 * Helper: Authenticate request token (Bearer ID token or ADMIN_SECRET_KEY)
 */
async function authenticateRequest(req: any): Promise<{ uid: string; email: string; isAdmin: boolean; isSecretKey: boolean }> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized — missing Bearer token');
  }

  const token = authHeader.slice(7).trim();
  const secretKey = process.env.ADMIN_SECRET_KEY;

  if (secretKey && token === secretKey) {
    return { uid: 'secret-key-admin', email: 'admin@bootstrap', isAdmin: true, isSecretKey: true };
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      isAdmin: decoded.admin === true,
      isSecretKey: false,
    };
  } catch {
    throw new Error('Unauthorized — invalid or expired token');
  }
}

/**
 * Function 1: Admin Bootstrap & Custom Claim Management
 * POST /setAdminClaim
 * Headers: Authorization: Bearer <ID_TOKEN or ADMIN_SECRET_KEY>
 * Body: { email?: string; uid?: string; claims: Record<string, any> }
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

    const { email, uid, claims } = req.body || {};

    if (!claims || typeof claims !== 'object') {
      res.status(400).json({ error: 'Missing or invalid "claims" object in body' });
      return;
    }

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

    const existingUser = await auth.getUser(targetUid);
    const updatedClaims = { ...(existingUser.customClaims || {}), ...claims };

    await auth.setCustomUserClaims(targetUid, updatedClaims);

    await writeAuditLog({
      adminUserId: caller.uid,
      adminEmail: caller.email,
      action: 'SET_ADMIN_CLAIMS',
      resourceType: 'user',
      resourceId: targetUid,
      metadata: { targetEmail, claims },
    });

    res.status(200).json({
      success: true,
      uid: targetUid,
      email: targetEmail,
      claims: updatedClaims,
      message: 'Custom claims set successfully. User must sign out and sign back in to refresh token claims.',
    });
  } catch (err: any) {
    console.error('setAdminClaim error:', err?.message || err);
    const status = err.message?.startsWith('Unauthorized') ? 401 : 500;
    res.status(status).json({ error: err?.message || 'Server error setting claims' });
  }
});

/**
 * Function 2: Self-Serve Account Deletion
 * POST /deleteAccount
 * Headers: Authorization: Bearer <USER_ID_TOKEN>
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

    // 1. Delete Firestore user documents & stats
    await db.collection('users').doc(uid).delete().catch(() => {});
    await db.collection('userStats').doc(uid).delete().catch(() => {});
    await db.collection('userAchievements').doc(uid).delete().catch(() => {});

    // 2. Delete Firestore user sessions
    const sessionsSnap = await db.collection('userSessions').where('userId', '==', uid).get().catch(() => null);
    if (sessionsSnap && !sessionsSnap.empty) {
      const batch = db.batch();
      sessionsSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit().catch(() => {});
    }

    // 3. Delete Firebase Auth user
    await auth.deleteUser(uid);

    await writeAuditLog({
      adminUserId: uid,
      adminEmail: user.email,
      action: 'DELETE_ACCOUNT',
      resourceType: 'user',
      resourceId: uid,
    });

    res.status(200).json({ success: true, message: 'Account and associated data deleted successfully.' });
  } catch (err: any) {
    console.error('deleteAccount error:', err?.message || err);
    const status = err.message?.startsWith('Unauthorized') ? 401 : 500;
    res.status(status).json({ error: err?.message || 'Failed to delete account' });
  }
});

/**
 * Function 3: Subscription & Payment Webhook Receiver
 * POST /handleSubscriptionWebhook
 * Receives Stripe / RevenueCat webhook events and updates user entitlement in Firestore.
 */
export const handleSubscriptionWebhook = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const event = req.body || {};
    const eventType = event.type || event.event?.type;

    console.log(`[WEBHOOK] Received event: ${eventType}`);

    // RevenueCat webhook handling
    if (event.event && event.event.app_user_id) {
      const rcEvent = event.event;
      const uid = rcEvent.app_user_id;
      const entitlementId = rcEvent.entitlement_id || 'premium';
      const isExpired = rcEvent.type === 'EXPIRATION' || rcEvent.type === 'CANCELLATION';
      const isPremium = !isExpired && (rcEvent.type === 'INITIAL_PURCHASE' || rcEvent.type === 'RENEWAL' || rcEvent.type === 'UNCANCELLATION');

      try {
        const userRef = db.collection('users').doc(uid);
        await userRef.set(
          {
            subscriptionStatus: isPremium ? 'premium' : 'free',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            revenueCatEntitlement: entitlementId,
          },
          { merge: true }
        );
      } catch (dbErr: any) {
        console.warn('Webhook Firestore update warning:', dbErr?.message || dbErr);
      }

      res.status(200).json({ received: true, uid, status: isPremium ? 'premium' : 'free' });
      return;
    }

    // Direct Stripe webhook handling fallback
    if (eventType && event.data?.object) {
      const obj = event.data.object;
      const uid = obj.metadata?.firebaseUid || obj.client_reference_id;

      if (uid) {
        let status: 'free' | 'premium' | 'trial' = 'free';
        if (eventType === 'checkout.session.completed' || eventType === 'customer.subscription.updated') {
          status = obj.status === 'trialing' ? 'trial' : 'premium';
        }

        try {
          await db.collection('users').doc(uid).set(
            {
              subscriptionStatus: status,
              stripeCustomerId: obj.customer || null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } catch (dbErr: any) {
          console.warn('Webhook Stripe Firestore update warning:', dbErr?.message || dbErr);
        }
      }

      res.status(200).json({ received: true });
      return;
    }

    res.status(200).json({ received: true, note: 'Unhandled event structure' });
  } catch (err: any) {
    console.error('handleSubscriptionWebhook error:', err?.message || err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
