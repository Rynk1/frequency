/**
 * Normalises system deep links before expo-router resolves them.
 *
 * The app's only supported inbound deep links are the Google Play / App Store
 * subscription return URLs (`?subscription=success|cancelled|pending`, plus an
 * optional `session_id`). Those query params must survive so `app/index.tsx`
 * can route the user to the subscription-result screen after payment. We
 * re-anchor them on the root route so the params land on `index` regardless of
 * the inbound URL shape (custom scheme vs universal link).
 *
 * Anything else is funnelled to the root, which then redirects to the Journey
 * landing tab.
 */
export function redirectSystemPath({
  path,
}: { path: string; initial: boolean }) {
  const match = path.match(/[?&](subscription=[^&#]+(?:&session_id=[^&#]+)?)/);
  if (match) {
    return `/?${match[1]}`;
  }
  return '/';
}