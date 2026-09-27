import { Platform } from 'react-native';
import { auth } from './firebase';
import { createCheckoutSession, reconcileSubscription, restorePurchases } from './subscription-service';

export interface NativePackage {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}

export interface NativeCustomerInfo {
  activeEntitlements: string[];
  isPremium: boolean;
  originalAppUserId: string;
  latestExpirationDate?: string;
}

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

let isRevenueCatConfigured = false;

async function getPurchasesModule(): Promise<any | null> {
  try {
    // @ts-ignore - optional native SDK loaded dynamically when installed in native build
    const mod = await import('react-native-purchases');
    return mod.default || mod;
  } catch {
    return null;
  }
}

/**
 * Initialize RevenueCat SDK on native mobile platforms (iOS / Android)
 */
export async function initializeNativePurchases(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey) {
    console.warn('[Purchases] RevenueCat API key not configured for platform:', Platform.OS);
    return false;
  }

  try {
    const Purchases = await getPurchasesModule();
    if (!Purchases) return false;

    Purchases.configure({ apiKey });
    isRevenueCatConfigured = true;

    const currentUser = auth.currentUser;
    if (currentUser) {
      await Purchases.logIn(currentUser.uid);
    }

    return true;
  } catch (err) {
    console.warn('[Purchases] Native Purchases SDK initialization skipped or unavailable:', err);
    return false;
  }
}

/**
 * Bind current Firebase UID to RevenueCat App User ID
 */
export async function identifyNativeUser(uid: string): Promise<void> {
  if (!isRevenueCatConfigured || Platform.OS === 'web') return;

  try {
    const Purchases = await getPurchasesModule();
    if (Purchases) await Purchases.logIn(uid);
  } catch (err) {
    console.warn('[Purchases] Failed to identify native user:', err);
  }
}

/**
 * Log out user from RevenueCat on sign out
 */
export async function resetNativeUser(): Promise<void> {
  if (!isRevenueCatConfigured || Platform.OS === 'web') return;

  try {
    const Purchases = await getPurchasesModule();
    if (Purchases) await Purchases.logOut();
  } catch (err) {
    console.warn('[Purchases] Failed to reset native user:', err);
  }
}

/**
 * Execute purchase flow via Native Store Billing or Web Checkout Fallback
 */
export async function purchasePlan(
  plan: 'monthly' | 'yearly',
  options: { trialEnabled?: boolean } = {}
): Promise<{ success: boolean; redirectUrl?: string; isPremium?: boolean }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to complete a purchase.');
  }

  if (isRevenueCatConfigured && Platform.OS !== 'web') {
    try {
      const Purchases = await getPurchasesModule();
      if (Purchases) {
        const offerings = await Purchases.getOfferings();

        if (offerings.current && offerings.current.availablePackages?.length > 0) {
          const pkg = offerings.current.availablePackages.find((p: any) =>
            plan === 'yearly' ? p.packageType === 'ANNUAL' : p.packageType === 'MONTHLY'
          ) || offerings.current.availablePackages[0];

          const { customerInfo } = await Purchases.purchasePackage(pkg);
          const isPremium = Boolean(customerInfo?.entitlements?.active?.['premium'] || customerInfo?.entitlements?.active?.['pro']);

          await reconcileSubscription();

          return { success: true, isPremium };
        }
      }
    } catch (err: any) {
      if (err.userCancelled) {
        return { success: false };
      }
      console.warn('[Purchases] Native store purchase failed, falling back to web checkout:', err?.message || err);
    }
  }

  // Web Checkout Fallback
  const { url } = await createCheckoutSession(plan, options);
  return { success: true, redirectUrl: url };
}

/**
 * Restore purchases across Native Stores or Server Reconciliation
 */
export async function executeRestorePurchases(): Promise<{ success: boolean; isPremium: boolean; message: string }> {
  if (isRevenueCatConfigured && Platform.OS !== 'web') {
    try {
      const Purchases = await getPurchasesModule();
      if (Purchases) {
        const customerInfo = await Purchases.restorePurchases();
        const isPremium = Boolean(customerInfo?.entitlements?.active?.['premium'] || customerInfo?.entitlements?.active?.['pro']);

        await reconcileSubscription();

        return {
          success: true,
          isPremium,
          message: isPremium
            ? 'Your store purchase was successfully verified and restored.'
            : 'No active native store subscription was found for your store account.',
        };
      }
    } catch (err: any) {
      console.warn('[Purchases] Native restore failed, executing server reconciliation fallback:', err);
    }
  }

  return await restorePurchases();
}
