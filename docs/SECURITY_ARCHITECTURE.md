# HARMONY FREQUENCY — SECURITY ARCHITECTURE & TRUST BOUNDARY MAP

## 1. System Architecture & Trust Boundary Diagram

```
                         ┌──────────────────────┐
                         │     Mobile Client    │
                         │    Expo / React      │
                         └──────────┬───────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
              Firebase Auth    Firestore        Audio Engine
                   │                │           (Fail-Closed)
                   │                │                │
                   │         Client-readable         │
                   │         / writable data         │
                   │                │                │
                   └────────┬───────┘                │
                            │                        │
                            ▼                        │
                   Firebase Cloud Functions ─────────┘
                            │
            ┌───────────────┼─────────────────┐
            │               │                 │
            ▼               ▼                 ▼
       Entitlements     Payments          Admin Ops
            │               │                 │
            ▼               ▼                 ▼
       Firestore       Provider API      Audit Logs
                            │
                            ▼
                    Google Play /
                    RevenueCat /
                    Stripe
```

---

## 2. Governing Security Principles

1. **Client Is Non-Authoritative**: The mobile client is an untrusted presentation layer. All security-sensitive decisions—including subscription entitlement, admin role checks, usage enforcement, and account deletion—must be made and verified by trusted server environments (Firebase Cloud Functions, Firestore Security Rules).
2. **Fail-Closed Execution**: If an entitlement check cannot be verified or an API fails outside the allowed offline grace period (72 hours), access MUST default to free capabilities.
3. **Financial Data Isolation**: Harmony Frequency systems never receive, process, or store raw payment card data or secret payment keys on the client.
4. **Immutable Audit Logging**: All administrative operations and account lifecycle changes create append-only audit records.

---

## 3. Trust Boundaries & Security Questions

| Boundary | Can Client Influence? | Is Value Security-Sensitive? | Authoritative Location | Enforcement Mechanism |
|---|---|---|---|---|
| User ID (UID) | No (derived from Auth token) | Yes | Firebase Auth | Firebase ID Token |
| Subscription Status | No | Yes | Cloud Functions / Provider | Webhook Signature + Server Writes |
| Custom Claims / Roles | No | Yes | Firebase Auth | Firebase Custom Claims |
| Free/Premium Audio Playback | Client Requests | Yes | Server Entitlement + Audio Validator | Entitlement Engine Fail-Closed Gate |
| Profile Display Name / Preferences | Yes | No | Firestore | Firestore Rules Field Allowlist |
| Session Usage Totals | Client Inputs | No (Display only) | Server Events | Firestore Append-Only Logs |

---

## 4. Threat Model (A1 – A7)

- **A1 — Modified Mobile Client**: An attacker modifies JS/native code to set `isPremium = true`.
  - *Mitigation*: Audio player and Entitlement Engine validate token/cached server signature. Premium audio specs require server-verified capability check.
- **A2 — Malicious Authenticated User**: User A attempts to read/modify User B's profile or data.
  - *Mitigation*: Firestore security rules enforce `request.auth.uid == userId`.
- **A3 — Unauthenticated Attacker**: Direct HTTP requests to server functions.
  - *Mitigation*: Bearer token authentication in Cloud Functions, strict CORS, input sanitization.
- **A4 — Webhook Attacker**: Forging payment webhooks to gain free premium.
  - *Mitigation*: Webhook authorization header / cryptographic signature verification (e.g. RevenueCat authorization token or Stripe signature). Rejection with 401 Unauthorized if invalid.
- **A5 — Compromised Admin**: Administrative credentials compromised.
  - *Mitigation*: Immutable `auditLogs`, prohibition of removing the last super-admin, explicit role schemas.
- **A6 — Payment Abuse Attacker**: Manipulating customer IDs or replaying purchase events.
  - *Mitigation*: Webhook idempotency via `subscriptionEvents/{eventId}`, server-resolved customer mapping.
- **A7 — Data Scraper**: Enumerating users or catalog content.
  - *Mitigation*: Rate limiting, Firestore security rules denying cross-user reads.
