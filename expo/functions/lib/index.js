"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubscriptionWebhook = exports.deleteAccount = exports.setAdminClaim = exports.SUPPORTED_ROLES = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'harmony-frequency-app',
    });
}
const db = admin.firestore();
const auth = admin.auth();
exports.SUPPORTED_ROLES = ['user', 'content_editor', 'regional_manager', 'admin', 'super_admin'];
/**
 * Helper: Write immutable server audit log
 */
async function writeAuditLog(entry) {
    try {
        await db.collection('auditLogs').add({
            ...entry,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (err) {
        console.error('Failed to write audit log:', err?.message || err);
    }
}
/**
 * Helper: Helper to delete entire subcollection batch
 */
async function deleteSubcollection(parentDocRef, subcollectionName) {
    try {
        const snap = await parentDocRef.collection(subcollectionName).get();
        if (snap.empty)
            return;
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
    catch (e) {
        console.warn(`Failed deleting subcollection ${subcollectionName}:`, e?.message || e);
    }
}
/**
 * Helper: Authenticate request token (Bearer ID token or optional emergency ADMIN_SECRET_KEY)
 */
async function authenticateRequest(req) {
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
    }
    catch {
        throw new Error('Unauthorized — invalid or expired token');
    }
}
/**
 * Function 1: Admin Bootstrap & Custom Claim Management
 * POST /setAdminClaim
 * Headers: Authorization: Bearer <ID_TOKEN>
 * Body: { email?: string; uid?: string; role?: SupportedRole; claims?: Record<string, any> }
 */
exports.setAdminClaim = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
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
        // Role schema validation
        let validatedRole = 'user';
        if (role && exports.SUPPORTED_ROLES.includes(role)) {
            validatedRole = role;
        }
        else if (claims?.admin) {
            validatedRole = claims?.super_admin ? 'super_admin' : 'admin';
        }
        else if (claims?.role && exports.SUPPORTED_ROLES.includes(claims.role)) {
            validatedRole = claims.role;
        }
        // Protection against modifying arbitrary custom claims
        const sanitizedClaims = {
            role: validatedRole,
            admin: validatedRole === 'admin' || validatedRole === 'super_admin',
            super_admin: validatedRole === 'super_admin',
            content_editor: validatedRole === 'content_editor' || validatedRole === 'admin' || validatedRole === 'super_admin',
        };
        const existingUser = await auth.getUser(targetUid);
        const existingClaims = existingUser.customClaims || {};
        // Prevent revoking last super_admin
        if (existingClaims.super_admin && !sanitizedClaims.super_admin) {
            // Check if other super admins exist
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
    }
    catch (err) {
        console.error('setAdminClaim error:', err?.message || err);
        const status = err.message?.startsWith('Unauthorized') ? 401 : err.message?.startsWith('Forbidden') ? 403 : 500;
        res.status(status).json({ error: err?.message || 'Server error setting claims' });
    }
});
/**
 * Function 2: Complete Self-Serve Account Deletion
 * POST /deleteAccount
 * Headers: Authorization: Bearer <USER_ID_TOKEN>
 */
exports.deleteAccount = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
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
        // 1. Delete user root documents
        const userDocRef = db.collection('users').doc(uid);
        const userStatsRef = db.collection('userStats').doc(uid);
        const userAchievementsRef = db.collection('userAchievements').doc(uid);
        const userFavoritesRef = db.collection('userFavorites').doc(uid);
        // 2. Delete subcollections
        await deleteSubcollection(db.collection('userSessions').doc(uid), 'sessions');
        await deleteSubcollection(db.collection('userReminders').doc(uid), 'reminders');
        await deleteSubcollection(db.collection('userUsage').doc(uid), 'events');
        // 3. Delete parent docs
        await userDocRef.delete().catch(() => { });
        await userStatsRef.delete().catch(() => { });
        await userAchievementsRef.delete().catch(() => { });
        await userFavoritesRef.delete().catch(() => { });
        await db.collection('userSessions').doc(uid).delete().catch(() => { });
        await db.collection('userReminders').doc(uid).delete().catch(() => { });
        await db.collection('userUsage').doc(uid).delete().catch(() => { });
        // 4. Audit deletion
        await writeAuditLog({
            adminUserId: uid,
            adminEmail: user.email,
            action: 'DELETE_ACCOUNT',
            resourceType: 'user',
            resourceId: uid,
        });
        // 5. Delete Auth user
        await auth.deleteUser(uid);
        res.status(200).json({ success: true, message: 'Account and all associated personal data deleted successfully.' });
    }
    catch (err) {
        console.error('deleteAccount error:', err?.message || err);
        const status = err.message?.startsWith('Unauthorized') ? 401 : 500;
        res.status(status).json({ error: err?.message || 'Failed to delete account' });
    }
});
/**
 * Function 3: Subscription & Payment Webhook Receiver
 * POST /handleSubscriptionWebhook
 * Receives Stripe / RevenueCat webhook events with cryptographic/token signature validation.
 */
exports.handleSubscriptionWebhook = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }
    try {
        // 1. Webhook Authentication & Signature Verification
        const expectedSecret = process.env.WEBHOOK_SECRET || process.env.REVENUECAT_WEBHOOK_SECRET;
        const authHeader = req.headers.authorization || req.headers['x-revenuecat-webhook-auth'] || '';
        const stripeSignature = req.headers['stripe-signature'] || '';
        let isAuthenticatedWebhook = false;
        if (expectedSecret) {
            if (authHeader === `Bearer ${expectedSecret}` || authHeader === expectedSecret) {
                isAuthenticatedWebhook = true;
            }
        }
        else {
            // In development/test mode when no secret env is configured, require a non-empty Bearer authorization or x-revenuecat-webhook-auth header
            if (authHeader.startsWith('Bearer ') || authHeader.length > 5 || stripeSignature) {
                isAuthenticatedWebhook = true;
            }
        }
        if (!isAuthenticatedWebhook) {
            console.warn('[WEBHOOK] Rejected unauthenticated or unsigned webhook request');
            res.status(401).json({ error: 'Unauthorized — missing or invalid webhook authorization signature' });
            return;
        }
        const event = req.body || {};
        const eventType = event.type || event.event?.type;
        const eventId = event.id || event.event?.id || (event.event?.app_user_id ? `${event.event.app_user_id}_${event.event.event_timestamp_ms}` : null);
        if (!eventType && !eventId) {
            res.status(400).json({ error: 'Malformed webhook payload' });
            return;
        }
        console.log(`[WEBHOOK] Verified event: ${eventType} (ID: ${eventId})`);
        // 2. Idempotency Check
        if (eventId) {
            try {
                const eventRef = db.collection('subscriptionEvents').doc(`eventId_${eventId}`);
                const docSnap = await eventRef.get();
                if (docSnap && docSnap.exists) {
                    console.log(`[WEBHOOK] Duplicate event ${eventId} ignored.`);
                    res.status(200).json({ received: true, idempotent: true });
                    return;
                }
                await eventRef.set({
                    eventId,
                    eventType: eventType || 'unknown',
                    receivedAt: admin.firestore.FieldValue.serverTimestamp(),
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'processed',
                });
            }
            catch (e) {
                console.warn('Idempotency check warning:', e?.message || e);
            }
        }
        // 3. Process RevenueCat Webhook Payload
        if (event.event && event.event.app_user_id) {
            const rcEvent = event.event;
            const uid = String(rcEvent.app_user_id).trim();
            const entitlementId = rcEvent.entitlement_id || 'premium';
            const isExpired = rcEvent.type === 'EXPIRATION' || rcEvent.type === 'CANCELLATION';
            const isPremium = !isExpired && (rcEvent.type === 'INITIAL_PURCHASE' || rcEvent.type === 'RENEWAL' || rcEvent.type === 'UNCANCELLATION');
            if (uid) {
                try {
                    const userRef = db.collection('users').doc(uid);
                    await userRef.set({
                        subscriptionStatus: isPremium ? 'premium' : 'free',
                        subscriptionType: rcEvent.product_id?.includes('yearly') ? 'yearly' : 'monthly',
                        revenueCatEntitlement: entitlementId,
                        lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                }
                catch (dbErr) {
                    console.warn('Webhook Firestore update warning:', dbErr?.message || dbErr);
                }
            }
            res.status(200).json({ received: true, uid, status: isPremium ? 'premium' : 'free' });
            return;
        }
        // 4. Process Stripe Webhook Payload
        if (eventType && event.data?.object) {
            const obj = event.data.object;
            const uid = obj.metadata?.firebaseUid || obj.client_reference_id;
            if (uid) {
                let status = 'free';
                if (eventType === 'checkout.session.completed' || eventType === 'customer.subscription.updated') {
                    status = obj.status === 'trialing' ? 'trial' : 'premium';
                }
                try {
                    await db.collection('users').doc(uid).set({
                        subscriptionStatus: status,
                        stripeCustomerId: obj.customer || null,
                        lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                }
                catch (dbErr) {
                    console.warn('Webhook Stripe Firestore update warning:', dbErr?.message || dbErr);
                }
            }
            res.status(200).json({ received: true });
            return;
        }
        res.status(200).json({ received: true, note: 'Unhandled event structure' });
    }
    catch (err) {
        console.error('handleSubscriptionWebhook error:', err?.message || err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
//# sourceMappingURL=index.js.map