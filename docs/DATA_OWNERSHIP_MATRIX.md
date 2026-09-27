# Harmony Frequency — Data Ownership & Authority Matrix

This document defines the canonical authority, read/write permissions, and provider boundaries for all data domains in the **Harmony Frequency** platform in accordance with Section 59 of the Master Specification.

---

## Data Ownership & Authority Matrix

| Data Domain | Authority System | Client Read | Client Write | Admin Write | Provider Role |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Auth Identity** | Firebase Auth | Yes | Limited (email/password) | No | None |
| **Profile & Preferences** | Firestore (`users/{uid}`) | Own (`uid`) | Approved fields only | Yes (`super_admin`) | None |
| **Subscription State** | Provider / RevenueCat | Derived | No | Command endpoint only | Primary Authority |
| **Entitlement Capabilities** | Harmony Entitlement Engine | Own (`uid`) | No | Controlled support action | None |
| **Payment Events Ledger** | RevenueCat / Stripe / App Stores | No | No | No | Immutable Event Source |
| **Audit Logs** | Harmony Server SDK | Restricted (`isAdmin`) | No | No | Server Append-Only |
| **Usage & Session Events** | Harmony Server / User | Own (`uid`) | Controlled event creation | No | Client Source |
| **Analytics Aggregates** | Pipeline / BigQuery / Firestore | Restricted (`isAdmin`) | No | No | Derived Projections |
| **Catalog Content** | Firestore (`frequencies`, etc.) | Public / Visibility-based | No | Yes (`content_editor` / `admin`) | None |

---

## Key Invariants

1. **Client Invariance:** The client is never the authority for subscriptions, entitlements, or payments. Client updates to `users/{uid}` cannot modify `subscriptionStatus`, `role`, `admin`, or entitlement flags.
2. **Cancellation vs. Refund:**
   - **Cancellation:** Sets `cancelAtPeriodEnd = true` and `willRenew = false`. Entitlement remains `ACTIVE` until the provider-authoritative expiration date.
   - **Refund:** Revokes entitlement immediately upon provider confirmation.
3. **Cache Scoping:** All local cache entries (e.g. AsyncStorage) are strictly namespaced by `uid` (`hf:user:{uid}:*`).
