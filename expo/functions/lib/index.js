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
exports.executeSupportAction = exports.reconcileSubscription = exports.handleSubscriptionWebhook = exports.deleteAccount = exports.setAdminClaim = exports.SUPPORTED_ROLES = void 0;
exports.isSubscriptionLapsed = isSubscriptionLapsed;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'frequency-c6236',
    });
}
const db = admin.firestore();
const auth = admin.auth();
exports.SUPPORTED_ROLES = [
    'user',
    'content_editor',
    'regional_manager',
    'support_admin',
    'finance_admin',
    'content_admin',
    'analytics_admin',
    'operations_admin',
    'admin',
    'super_admin',
];
/**
 * Helper: Normalise a stored date (ISO string, Firestore Timestamp, epoch ms or
 * epoch seconds) to epoch milliseconds. Returns null when unparseable.
 */
function toEpochMs(value) {
    if (!value)
        return null;
    if (typeof value === 'number')
        return value < 1e12 ? value * 1000 : value;
    if (typeof value === 'string') {
        const ms = Date.parse(value);
        return Number.isNaN(ms) ? null : ms;
    }
    if (typeof value.toDate === 'function')
        return value.toDate().getTime();
    if (typeof value.seconds === 'number')
        return value.seconds * 1000;
    return null;
}
/**
 * Helper: Whether a stored subscription's paid period has already ended.
 *
 * The entitlement document can lag behind the store (a webhook may be missed),
 * so premium is re-derived from the recorded expiry rather than trusted blindly.
 * A subscription with no recorded expiry is treated as active.
 */
function isSubscriptionLapsed(subscription, nowMs = Date.now()) {
    const expirationMs = toEpochMs(subscription?.expirationAt ?? subscription?.subscriptionEndsAt);
    return expirationMs !== null && expirationMs <= nowMs;
}
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
 * Helper: Delete entire subcollection batch
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
 * Helper: Authenticate request token
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
 * Helper: Helper to compute canonical capabilities from premium flag
 */
function computeCapabilities(isPremium) {
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
        const sanitizedClaims = {
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
        const userDocRef = db.collection('users').doc(uid);
        const subscriptionRef = db.collection('subscriptions').doc(uid);
        const entitlementRef = db.collection('entitlements').doc(uid);
        const userStatsRef = db.collection('userStats').doc(uid);
        const userAchievementsRef = db.collection('userAchievements').doc(uid);
        const userFavoritesRef = db.collection('userFavorites').doc(uid);
        await deleteSubcollection(db.collection('userSessions').doc(uid), 'sessions');
        await deleteSubcollection(db.collection('userReminders').doc(uid), 'reminders');
        await deleteSubcollection(db.collection('userUsage').doc(uid), 'events');
        await userDocRef.delete().catch(() => { });
        await subscriptionRef.delete().catch(() => { });
        await entitlementRef.delete().catch(() => { });
        await userStatsRef.delete().catch(() => { });
        await userAchievementsRef.delete().catch(() => { });
        await userFavoritesRef.delete().catch(() => { });
        await db.collection('userSessions').doc(uid).delete().catch(() => { });
        await db.collection('userReminders').doc(uid).delete().catch(() => { });
        await db.collection('userUsage').doc(uid).delete().catch(() => { });
        await writeAuditLog({
            adminUserId: uid,
            adminEmail: user.email,
            action: 'DELETE_ACCOUNT',
            resourceType: 'user',
            resourceId: uid,
        });
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
 * Four-layer state architecture with transactional idempotency & out-of-order protection.
 */
exports.handleSubscriptionWebhook = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }
    try {
        const expectedSecret = process.env.WEBHOOK_SECRET || process.env.REVENUECAT_WEBHOOK_SECRET;
        const authHeader = req.headers.authorization || req.headers['x-revenuecat-webhook-auth'] || '';
        let isAuthenticatedWebhook = false;
        if (expectedSecret) {
            if (authHeader === `Bearer ${expectedSecret}` || authHeader === expectedSecret) {
                isAuthenticatedWebhook = true;
            }
        }
        else {
            // Fail closed. Without a configured shared secret we cannot verify the
            // sender, so we must never accept the event — otherwise any caller could
            // POST a crafted purchase event and grant themselves premium.
            console.error('[WEBHOOK] WEBHOOK_SECRET / REVENUECAT_WEBHOOK_SECRET is not configured — rejecting webhook');
            res.status(500).json({ error: 'Webhook secret is not configured on the server' });
            return;
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
            // Store-provided period boundaries. RevenueCat sends millisecond epoch
            // timestamps; keep them as ISO strings so the client can render the same
            // renewal/expiry dates the user sees in Google Play.
            const toIso = (ms) => typeof ms === 'number' && ms > 0 ? new Date(ms).toISOString() : undefined;
            const expirationAt = toIso(rcEvent.expiration_at_ms);
            const purchasedAt = toIso(rcEvent.purchased_at_ms);
            const subscriptionType = productId.includes('yearly') ? 'yearly' : 'monthly';
            // `willRenew` is false for a cancellation but also for any terminal state.
            const willRenew = isPremium && !isCancelled;
            const subStatus = isExpired
                ? (rcEvent.type === 'REFUND' ? 'refunded' : rcEvent.type === 'REVOCATION' ? 'revoked' : 'expired')
                : isCancelled
                    ? 'cancelled'
                    : rcEvent.type === 'TRIAL_STARTED'
                        ? 'trial'
                        : isPremium
                            ? 'active'
                            : 'none';
            let transactionResult = { processingStatus: 'PROCESSED', isPremium, subStatus };
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
                        subscriptionType,
                        willRenew,
                        cancelAtPeriodEnd: isCancelled,
                        expirationAt: expirationAt || null,
                        purchasedAt: purchasedAt || null,
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
                    // Mirror the store-authoritative details onto the user document so the
                    // paywall, settings card and result screen all render the same plan,
                    // renewal date and auto-renew state the user sees in Google Play.
                    transaction.set(userRef, {
                        subscriptionStatus: isPremium ? (rcEvent.type === 'TRIAL_STARTED' ? 'trial' : 'premium') : 'free',
                        isPremium,
                        subscriptionType,
                        subscriptionEndsAt: expirationAt ? new Date(expirationAt) : null,
                        trialEndsAt: rcEvent.type === 'TRIAL_STARTED' && expirationAt ? new Date(expirationAt) : null,
                        cancelAtPeriodEnd: isCancelled,
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
            }
            catch (dbErr) {
                console.warn('Webhook Firestore transaction warning (falling back):', dbErr?.message || dbErr);
            }
            res.status(200).json({ received: true, uid, status: isPremium ? 'premium' : 'free', ...transactionResult });
            return;
        }
        res.status(200).json({ received: true, note: 'Unhandled event structure' });
    }
    catch (err) {
        console.error('handleSubscriptionWebhook error:', err?.message || err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
/**
 * Function 4: Trusted Subscription Reconciliation & Restore
 * POST /reconcileSubscription
 * Allows client to request server verification & entitlement sync upon app launch or Restore Purchases.
 */
exports.reconcileSubscription = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }
    try {
        const user = await authenticateRequest(req);
        const uid = user.uid;
        let subData = null;
        let entData = null;
        try {
            const subSnap = await db.collection('subscriptions').doc(uid).get();
            const entSnap = await db.collection('entitlements').doc(uid).get();
            subData = subSnap.exists ? subSnap.data() : null;
            entData = entSnap.exists ? entSnap.data() : null;
        }
        catch (e) {
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
        // The stored entitlement can lag behind the store: a subscription may have
        // lapsed since the last webhook. Re-derive premium from the recorded expiry
        // so a user is never granted access they are no longer paying for.
        const lapsed = isSubscriptionLapsed(subData);
        const isPremium = Boolean(entData.isPremium) && !lapsed;
        const entitlement = {
            ...entData,
            isPremium,
            status: isPremium ? entData.status : 'expired',
            capabilities: computeCapabilities(isPremium),
            verifiedAt: new Date().toISOString(),
        };
        if (isPremium !== Boolean(entData.isPremium)) {
            // Persist the corrected state so the app and Firestore agree.
            try {
                await db.collection('entitlements').doc(uid).set({ isPremium, status: entitlement.status, capabilities: entitlement.capabilities, verifiedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            }
            catch (e) {
                console.warn('Reconciliation entitlement write warning:', e?.message || e);
            }
        }
        res.status(200).json({ success: true, subscription: subData, entitlement });
    }
    catch (err) {
        console.error('reconcileSubscription error:', err?.message || err);
        const status = err.message?.startsWith('Unauthorized') ? 401 : 500;
        res.status(status).json({ error: err?.message || 'Reconciliation failed' });
    }
});
/**
 * Function 5: Discrete Administrative Support Actions Engine
 * POST /executeSupportAction
 * Enforces two-layer idempotency, admin claims verification, and structured audit logging
 * for support operations (REFUND, CANCEL_RENEWAL, EXTEND_TRIAL, GRANT_COMP, REVOKE_COMP, RECONCILE).
 */
exports.executeSupportAction = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }
    try {
        const caller = await authenticateRequest(req);
        if (!caller.isAdmin) {
            res.status(403).json({ error: 'Forbidden — administrative authorization required.' });
            return;
        }
        const { uid, operationType, idempotencyKey, reason, providerReference } = req.body || {};
        if (!uid || typeof uid !== 'string' || !uid.trim()) {
            res.status(400).json({ error: 'Missing required target "uid"' });
            return;
        }
        if (!operationType || !['REFUND', 'CANCEL_RENEWAL', 'EXTEND_TRIAL', 'GRANT_COMP', 'REVOKE_COMP', 'RECONCILE'].includes(operationType)) {
            res.status(400).json({ error: 'Invalid or missing "operationType"' });
            return;
        }
        const key = String(idempotencyKey || `${uid}_${operationType}_${Date.now()}`).trim();
        const targetUid = uid.trim();
        const nowServer = admin.firestore.FieldValue.serverTimestamp();
        let resultingState = 'PROCESSED';
        let isPremiumNew = false;
        try {
            const actionDocRef = db.collection('supportActions').doc(key);
            const existingAction = await actionDocRef.get();
            if (existingAction.exists) {
                res.status(200).json({
                    idempotent: true,
                    message: 'Support action was previously executed.',
                    action: existingAction.data(),
                });
                return;
            }
            const subRef = db.collection('subscriptions').doc(targetUid);
            const entRef = db.collection('entitlements').doc(targetUid);
            const userRef = db.collection('users').doc(targetUid);
            if (operationType === 'REFUND' || operationType === 'REVOKE_COMP') {
                isPremiumNew = false;
                resultingState = operationType === 'REFUND' ? 'refunded' : 'revoked';
                await subRef.set({
                    subscriptionStatus: resultingState,
                    willRenew: false,
                    cancelAtPeriodEnd: true,
                    updatedAt: nowServer,
                }, { merge: true });
                await entRef.set({
                    isPremium: false,
                    status: resultingState,
                    capabilities: computeCapabilities(false),
                    verifiedAt: nowServer,
                }, { merge: true });
                await userRef.set({
                    subscriptionStatus: 'free',
                    isPremium: false,
                    updatedAt: nowServer,
                }, { merge: true });
            }
            else if (operationType === 'CANCEL_RENEWAL') {
                resultingState = 'cancelled_at_period_end';
                await subRef.set({
                    willRenew: false,
                    cancelAtPeriodEnd: true,
                    updatedAt: nowServer,
                }, { merge: true });
                await userRef.set({
                    cancelAtPeriodEnd: true,
                    updatedAt: nowServer,
                }, { merge: true });
            }
            else if (operationType === 'EXTEND_TRIAL' || operationType === 'GRANT_COMP') {
                isPremiumNew = true;
                resultingState = operationType === 'EXTEND_TRIAL' ? 'trial' : 'active';
                await subRef.set({
                    subscriptionStatus: resultingState,
                    willRenew: false,
                    cancelAtPeriodEnd: false,
                    updatedAt: nowServer,
                }, { merge: true });
                await entRef.set({
                    isPremium: true,
                    status: resultingState,
                    capabilities: computeCapabilities(true),
                    verifiedAt: nowServer,
                }, { merge: true });
                await userRef.set({
                    subscriptionStatus: operationType === 'EXTEND_TRIAL' ? 'trial' : 'premium',
                    isPremium: true,
                    updatedAt: nowServer,
                }, { merge: true });
            }
            else if (operationType === 'RECONCILE') {
                const entSnap = await entRef.get();
                isPremiumNew = entSnap.exists && entSnap.data()?.isPremium === true;
                resultingState = isPremiumNew ? 'active' : 'free';
            }
            const supportActionRecord = {
                operationId: key,
                uid: targetUid,
                requestedBy: caller.email,
                requestedAt: nowServer,
                operationType,
                provider: 'revenuecat',
                providerReference: providerReference || null,
                reason: reason || 'Admin Support Request',
                idempotencyKey: key,
                status: 'COMPLETED',
                resultingState,
                completedAt: nowServer,
            };
            await actionDocRef.set(supportActionRecord);
            await writeAuditLog({
                adminUserId: caller.uid,
                adminEmail: caller.email,
                action: `SUPPORT_ACTION_${operationType}`,
                resourceType: 'subscription',
                resourceId: targetUid,
                metadata: { operationType, key, reason },
            });
        }
        catch (dbErr) {
            console.warn('Support action Firestore write warning (falling back):', dbErr?.message || dbErr);
        }
        res.status(200).json({
            success: true,
            operationId: key,
            targetUid,
            operationType,
            resultingState,
            isPremium: isPremiumNew,
            message: `Support action ${operationType} executed successfully.`,
        });
    }
    catch (err) {
        console.error('executeSupportAction error:', err?.message || err);
        const status = err.message?.startsWith('Unauthorized') ? 401 : err.message?.startsWith('Forbidden') ? 403 : 500;
        res.status(status).json({ error: err?.message || 'Support action failed' });
    }
});
//# sourceMappingURL=index.js.map