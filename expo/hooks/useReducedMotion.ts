import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tracks the OS "reduce motion" setting.
 *
 * The player's visuals are decorative motion. For users who have asked the
 * system to reduce motion — commonly people with vestibular disorders, and a
 * meaningful share of the meditation audience — continuous animation can cause
 * dizziness or nausea. Respecting the flag is the difference between a calming
 * app and an unusable one.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduced(enabled);
      })
      .catch(() => {
        // Older platforms without the API: assume motion is fine.
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => setReduced(enabled)
    );

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}
