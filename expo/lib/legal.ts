/**
 * Publicly reachable legal pages.
 *
 * Google Play requires a hosted privacy policy URL at submission time; an
 * in-app text blurb does not satisfy the requirement. These must be replaced
 * with the live production URLs before the store listing is submitted.
 */
export const LEGAL_URLS = {
  privacyPolicy: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || 'https://harmonyfrequency.app/privacy',
  termsOfService: process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL || 'https://harmonyfrequency.app/terms',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@harmonyfrequency.app',
} as const;
