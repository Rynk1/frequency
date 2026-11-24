import { Platform } from 'react-native';

/**
 * Billing copy has to name the right store. The app is Android-first, but an
 * iOS build is one config change away, and telling an iPhone user to manage a
 * subscription in Google Play is both wrong and a review risk.
 */

export function storeName(): string {
  if (Platform.OS === 'ios') return 'the App Store';
  if (Platform.OS === 'android') return 'Google Play';
  return 'the store';
}

export function openingStoreLabel(): string {
  return `Opening ${storeName()}...`;
}

export function storeUnavailableMessage(): string {
  return `In-app purchases are unavailable on this device. Update the app through ${storeName()} and try again.`;
}

export function couldNotOpenSubscriptionsMessage(): string {
  return `Could not open the subscription screen. Manage your subscription in ${storeName()} settings.`;
}

export function secureProcessingNote(): string {
  return `Subscriptions are securely processed by ${storeName()}. Cancel anytime.`;
}

export function secureCheckoutLabel(): string {
  return `Secure checkout by ${storeName()}`;
}

export function manageSubscriptionHint(): string {
  return Platform.OS === 'ios'
    ? 'Manage or cancel your subscription in your App Store account settings.'
    : `Manage or cancel your subscription anytime in ${storeName()}.`;
}

export function autoRenewNote(): string {
  return `Subscriptions auto-renew unless cancelled at least 24 hours before the period ends. ${manageSubscriptionHint()}`;
}

export function verifyingPurchaseLabel(): string {
  return `Verifying your payment with ${storeName()}...`;
}

export function verifyingShortLabel(): string {
  return `Verifying with ${storeName()}...`;
}
