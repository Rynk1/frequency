import { Platform } from 'react-native';
import { auth } from './firebase';
import { reconcileSubscription, restorePurchases } from './subscription-service';
import { PREMIUM_PRODUCT_IDS, type BillingPlanId } from './pricing';

/**
 * Google Play billing engine.
 *
 * Purchases are processed by Google Play Billing and brokered through
 * RevenueCat (`react-native-purchases`), the native store SDK for this app. The
 * store is the financial source of truth: the client never grants or extends
 * premium access itself — it only asks the SDK to open the native purchase
 * sheet, then reconciles the resulting entitlement with the server.
 *
 * The SDK is loaded dynamically so web builds and Expo Go keep working; when it
 * is unavailable (web, or a build without the native module) callers fall back
 * to server-side reconciliation / store management deep links.
 */

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

export interface StorePrice {
  /** Localized price string straight from the store, e.g. "$9.99". */
  priceString: string;
  currencyCode: string;
  /** Numeric price from the store, used for per-month / savings maths. */
  price: number;
}

export interface PlanOfferings {
  monthly?: StorePrice;
  yearly?: StorePrice;
}

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

/** RevenueCat entitlement identifier that unlocks premium. */
const PREMIUM_ENTITLEMENT_ID = 'premium';

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

function isPremiumCustomerInfo(customerInfo: any): boolean {
  const active = customerInfo?.entitlements?.active || {};
  return Boolean(active[PREMIUM_ENTITLEMENT_ID]);
}

/**
 * Initialize the native store billing SDK on mobile platforms (iOS / Android).
 */
export async function initializeNativePurchases(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey) {
    console.warn('[Purchases] Store billing API key not configured for platform:', Platform.OS);
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
    console.warn('[Purchases] Native store billing SDK initialization skipped or unavailable:', err);
    return false;
  }
}

/**
 * Bind current Firebase UID to the store billing customer id.
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
 * Log out user from the store billing SDK on sign out.
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

/** Whether the native store purchase sheet can be presented on this platform. */
export function isStoreBillingAvailable(): boolean {
  return isRevenueCatConfigured && Platform.OS !== 'web';
}

/**
 * Read the live store prices so the paywall shows exactly what Google Play
 * charges, instead of a hardcoded figure that can drift from the store listing.
 */
export async function getStoreOfferings(): Promise<PlanOfferings | null> {
  if (!isRevenueCatConfigured || Platform.OS === 'web') return null;

  try {
    const Purchases = await getPurchasesModule();
    if (!Purchases) return null;

    const offerings = await Purchases.getOfferings();
    const packages = offerings?.current?.availablePackages;
    if (!Array.isArray(packages) || packages.length === 0) return null;

    const toPrice = (pkg: any): StorePrice | undefined => {
      const product = pkg?.product;
      if (!product) return undefined;
      return {
        priceString: product.priceString ?? String(product.price ?? ''),
        currencyCode: product.currencyCode ?? 'USD',
        price: typeof product.price === 'number' ? product.price : Number(product.price) || 0,
      };
    };

    const monthlyPkg = packages.find(
      (p: any) => p.packageType === 'MONTHLY' || p.product?.identifier === PREMIUM_PRODUCT_IDS.monthly
    );
    const yearlyPkg = packages.find(
      (p: any) => p.packageType === 'ANNUAL' || p.product?.identifier === PREMIUM_PRODUCT_IDS.yearly
    );

    return {
      monthly: monthlyPkg ? toPrice(monthlyPkg) : undefined,
      yearly: yearlyPkg ? toPrice(yearlyPkg) : undefined,
    };
  } catch (err) {
    console.warn('[Purchases] Failed to load store offerings:', err);
    return null;
  }
}

/**
 * Execute the purchase flow through Google Play Billing.
 */
export async function purchasePlan(
  plan: BillingPlanId
): Promise<{ success: boolean; isPremium?: boolean }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to complete a purchase.');
  }

  if (!isStoreBillingAvailable()) {
    throw new Error('In-app purchases are unavailable on this device. Please update the app or try again on a supported device.');
  }

  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    throw new Error('In-app purchases are unavailable on this device.');
  }

  const offerings = await Purchases.getOfferings();
  const packages = offerings?.current?.availablePackages;
  if (!Array.isArray(packages) || packages.length === 0) {
    throw new Error('No subscription plans are available right now. Please try again later.');
  }

  const productId = PREMIUM_PRODUCT_IDS[plan];
  const pkg =
    packages.find((p: any) =>
      plan === 'yearly'
        ? p.packageType === 'ANNUAL' || p.product?.identifier === productId
        : p.packageType === 'MONTHLY' || p.product?.identifier === productId
    ) || packages[0];

  const { customerInfo } = await Purchases.purchasePackage(pkg);

  // The store confirmed the purchase; sync the server-authoritative entitlement.
  await reconcileSubscription();

  return { success: true, isPremium: isPremiumCustomerInfo(customerInfo) };
}

/**
 * Restore purchases across the native store, then reconcile the server.
 */
export async function executeRestorePurchases(): Promise<{ success: boolean; isPremium: boolean; message: string }> {
  if (isStoreBillingAvailable()) {
    try {
      const Purchases = await getPurchasesModule();
      if (Purchases) {
        const customerInfo = await Purchases.restorePurchases();
        const isPremium = isPremiumCustomerInfo(customerInfo);

        await reconcileSubscription();

        return {
          success: true,
          isPremium,
          message: isPremium
            ? 'Your store purchase was successfully verified and restored.'
            : 'No active store subscription was found for your account.',
        };
      }
    } catch (err: any) {
      console.warn('[Purchases] Native restore failed, executing server reconciliation fallback:', err);
    }
  }

  return await restorePurchases();
}
