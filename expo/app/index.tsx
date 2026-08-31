import { useEffect } from 'react';
import { Redirect, useRouter, useGlobalSearchParams } from 'expo-router';

/**
 * Root entry route.
 *
 * Reads the `subscription` query param that Stripe Checkout attaches to its
 * success/cancel redirect URLs:
 *   - success: ?subscription=success&session_id={CHECKOUT_SESSION_ID}
 *   - cancel:  ?subscription=cancelled
 *
 * When present, route to the dedicated subscription-result screen so the user
 * gets a clear, premium-styled confirmation (with server-verified entitlement).
 * Otherwise, default into the main tab navigator.
 */
export default function Index() {
  const params = useGlobalSearchParams<{ subscription?: string; session_id?: string }>();
  const router = useRouter();

  useEffect(() => {
    const status = (params.subscription || '').toLowerCase();
    if (status === 'success' || status === 'cancelled' || status === 'cancel' || status === 'pending') {
      // Replace history so the back button does not bounce back to the result screen.
      router.replace({
        pathname: '/subscription-result',
        params: { subscription: status, session_id: params.session_id || '' },
      });
    }
  }, [params.subscription, params.session_id, router]);

  // Default flow — no subscription param present.
  if (!params.subscription) {
    return <Redirect href={'/categories' as any} />;
  }

  // While the redirect effect runs, render a neutral empty shell.
  return null;
}
