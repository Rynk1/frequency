# HARMONY FREQUENCY — PRODUCTION RELEASE & DEPLOYMENT GUIDE

This document details the exact pre-requisites, configuration steps, and release commands required for the project owner to launch **Harmony Frequency** on the Google Play Store.

---

## 1. Google Play Console Pre-Requisites (Owner Action Required)

### A. Developer Account & Merchant Account
1. Ensure your **Google Play Developer Account** is active.
2. Link a **Google Payments Merchant Account** in Play Console settings to enable digital subscriptions.

### B. In-App Subscription Product Setup
1. In Google Play Console → **Monetization** → **Subscriptions**, create two subscription products:
   * **Monthly Plan:** Product ID `monthly_premium` (e.g. $9.99/mo with 7-day free trial).
   * **Yearly Plan:** Product ID `yearly_premium` (e.g. $95.99/yr with 7-day free trial).

### C. Compliance Declarations
1. **Data Safety Form:** Declare email address collection for authentication and session stats for personal app usage.
2. **Account Deletion URL & In-App Declaration:** The app now includes an in-app **Delete Account** feature under Settings -> Account. Declare this in Play Console Data Safety settings.
3. **Privacy Policy URL:** Link to your public privacy policy URL (e.g., `https://harmonyfrequency.app/privacy`).

---

## 2. RevenueCat Project & Webhook Setup

1. Sign in to **RevenueCat Dashboard** (https://app.revenuecat.com/).
2. Create a project named **Harmony Frequency**.
3. Under **Project Settings** → **Integrations** → **Google Play Store**, upload your Google Service Account JSON key.
4. Create Entitlement ID: `premium`.
5. Attach `monthly_premium` and `yearly_premium` products to the `premium` entitlement.
6. Under **Integrations** → **Webhooks**, add your Firebase Cloud Function webhook URL:
   ```text
   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/handleSubscriptionWebhook
   ```

---

## 3. Database & Content Seeding

To seed or restore all 46 frequencies, 15 curated audio programs, and 8 educational articles to Cloud Firestore:

```bash
cd expo
npm run seed
```

For a dry-run check without modifying Firestore:
```bash
npm run seed -- --dry-run
```

---

## 4. Deploying Firebase Cloud Functions

Deploy the 3 serverless backend functions (`setAdminClaim`, `deleteAccount`, `handleSubscriptionWebhook`) to Firebase:

```bash
cd expo/functions
npm run build
firebase deploy --only functions
```

---

## 5. EAS Android Build Commands

### A. Generate Preview APK (for physical device QA):
```bash
cd expo
eas build --platform android --profile preview
```

### B. Generate Production Android App Bundle (.aab):
```bash
cd expo
eas build --platform android --profile production
```

### C. Submit Production Bundle to Google Play Internal Track:
```bash
cd expo
eas submit --platform android --profile production
```
