/**
 * Shared user-facing strings.
 *
 * This is a lightweight key catalogue, not a full i18n system. It exists so
 * copy can be reviewed in one place and translated without hunting through
 * components. Placeholders use `{name}` and are filled by `t()`.
 *
 * Claim-sensitive copy must still pass the checklist in
 * docs/VOICE_TONE_AND_CLAIMS.md before it lands here.
 */

export const STRINGS = {
  'common.search.placeholder': 'Search by need, Hz, or name...',
  'common.done': 'Done',
  'common.close': 'Close',
  'common.continueFree': 'Not now, keep exploring free',

  'explore.eyebrow': 'Explore',
  'explore.title': 'Frequencies',
  'explore.tab.overview': 'Overview',
  'explore.tab.library': 'Library',
  'explore.empty.title': 'No matching needs',
  'explore.empty.body': 'Try sleep, anxiety, focus or a frequency like 528',
  'explore.library.empty.title': 'No matching tracks',
  'explore.library.empty.body': 'Try sleep, anxiety, focus or a frequency like 528',
  'explore.category.tracks': '{count} tracks',
  'explore.category.explore': 'Explore {name}',
  'explore.category.more': '+{count} more',
  'explore.results.one': '{count} track',
  'explore.results.other': '{count} tracks',
  'explore.badge.preview': 'Preview',

  'sessions.eyebrow': 'Your Practice',
  'sessions.title': 'Journey',
  'sessions.tab.overview': 'Overview',
  'sessions.tab.programs': 'Guided Programs',
  'sessions.programs.subtitle': 'Guided programs for sleep, calm and focus',
  'sessions.dailyAlignment': 'Daily Alignment',
  'sessions.begin': 'Begin Session',
  'sessions.mySessions': 'My Sessions',
  'sessions.new': 'New',
  'sessions.empty.active.title': 'No active sessions',
  'sessions.empty.active.body': 'Create a session or choose a guided program below',
  'sessions.empty.scheduled.title': 'No scheduled sessions',
  'sessions.empty.scheduled.body': 'Create sessions with a schedule to see them here',
  'sessions.empty.completed.title': 'No completed sessions',
  'sessions.empty.completed.body': 'Complete your first session to see it here',
  'sessions.create': 'Create Session',
  'sessions.detail.frequencySequence': 'Frequency Sequence',
  'sessions.detail.addToMySessions': 'Add to My Sessions',
  'sessions.detail.startNow': 'Start Now',
  'sessions.detail.startSession': 'Start Session',
  'sessions.achievements': 'Achievements',
  'sessions.achievements.unlocked': '{unlocked}/{total} unlocked',
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const template: string = STRINGS[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
}

export function pluralTracks(count: number): string {
  return t(count === 1 ? 'explore.results.one' : 'explore.results.other', { count });
}
