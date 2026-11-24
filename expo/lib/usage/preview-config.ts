import { CANONICAL_PREMIUM_POLICY } from './PremiumPolicy';

let overrideSeconds: number | null = null;

function readConfiguredSeconds(): number | null {
  try {
    const Constants = require('expo-constants').default as typeof import('expo-constants').default;
    const raw = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.previewDurationSeconds;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Preview length resolves in this order: an explicit runtime override, then
 * the Expo app config value (changeable through an OTA update), then the
 * canonical 3-minute default. A future remote-config provider only needs to
 * call setPreviewDurationOverride.
 */
export function getPreviewDurationSeconds(): number {
  return overrideSeconds ?? readConfiguredSeconds() ?? CANONICAL_PREMIUM_POLICY.premiumPreviewDuration;
}

export function setPreviewDurationOverride(seconds: number | null): void {
  overrideSeconds = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
    ? Math.round(seconds)
    : null;
}

export function getPreviewLabel(): string {
  const minutes = getPreviewDurationSeconds() / 60;
  const rounded = Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
  return `${rounded}-MINUTE PREVIEW`;
}
