export type SystemOperatingMode =
  | 'ONLINE'
  | 'DEGRADED'
  | 'OFFLINE'
  | 'MAINTENANCE'
  | 'AUTH_ERROR'
  | 'SERVICE_ERROR';

export interface OperationalFeatureFlags {
  purchasesEnabled: boolean;
  binauralModeEnabled: boolean;
  customMixingEnabled: boolean;
  offlineDownloadsEnabled: boolean;
  experimentalFeaturesEnabled: boolean;
  maintenanceMode: boolean;
  disabledFrequencies: string[];
  disabledProgrammes: string[];
  minimumSupportedAppVersion: string;
  currentRecommendedAppVersion: string;
}

export const DEFAULT_FEATURE_FLAGS: OperationalFeatureFlags = {
  purchasesEnabled: true,
  binauralModeEnabled: true,
  customMixingEnabled: true,
  offlineDownloadsEnabled: true,
  experimentalFeaturesEnabled: false,
  maintenanceMode: false,
  disabledFrequencies: [],
  disabledProgrammes: [],
  minimumSupportedAppVersion: '1.0.0',
  currentRecommendedAppVersion: '1.0.0',
};

export const OPERATIONAL_MESSAGES: Record<SystemOperatingMode, { title: string; body: string }> = {
  ONLINE: {
    title: 'All Systems Operational',
    body: 'Harmony Frequency is fully connected and active.',
  },
  DEGRADED: {
    title: 'Degraded Connection',
    body: 'Your saved content is available offline, but syncing is temporarily reduced.',
  },
  OFFLINE: {
    title: 'Offline Mode Active',
    body: 'You are currently offline. Your downloaded frequencies remain accessible.',
  },
  MAINTENANCE: {
    title: 'Scheduled Maintenance',
    body: 'Harmony Frequency is undergoing scheduled upgrades. Service will resume shortly.',
  },
  AUTH_ERROR: {
    title: 'Authentication Error',
    body: 'Unable to verify session credentials. Please sign in again.',
  },
  SERVICE_ERROR: {
    title: 'Service Temporarily Unavailable',
    body: 'We are experiencing temporary service disruption. Please try again in a few moments.',
  },
};

let currentFlags: OperationalFeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
let currentMode: SystemOperatingMode = 'ONLINE';

export function getFeatureFlags(): OperationalFeatureFlags {
  return currentFlags;
}

export function updateFeatureFlags(flags: Partial<OperationalFeatureFlags>): void {
  currentFlags = { ...currentFlags, ...flags };
  if (currentFlags.maintenanceMode) {
    currentMode = 'MAINTENANCE';
  }
}

export function getSystemOperatingMode(): SystemOperatingMode {
  return currentMode;
}

export function setSystemOperatingMode(mode: SystemOperatingMode): void {
  currentMode = mode;
}

export function isFrequencyEnabled(frequencyIdOrHz: string): boolean {
  return !currentFlags.disabledFrequencies.includes(frequencyIdOrHz);
}

export function isProgrammeEnabled(programmeId: string): boolean {
  return !currentFlags.disabledProgrammes.includes(programmeId);
}
