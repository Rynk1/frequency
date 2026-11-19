/**
 * Visual style catalogue for the player.
 *
 * Kept free of React Native imports so the labels and cycle order can be tested
 * directly and shared by every surface that shows a style name.
 */
export type VisualizerStyle = 'wave' | 'equalizer' | 'orb';

export const VISUALIZER_STYLES: readonly VisualizerStyle[] = ['wave', 'equalizer', 'orb'];

/** Display names shared by the player sheet and the full-screen stage. */
export const VISUALIZER_LABELS: Record<VisualizerStyle, string> = {
  wave: 'Waves',
  equalizer: 'Equaliser',
  orb: 'Orb',
};

/** Cycles through the styles in a stable, discoverable order. */
export function nextVisualizerStyle(style: VisualizerStyle): VisualizerStyle {
  const index = VISUALIZER_STYLES.indexOf(style);
  return VISUALIZER_STYLES[(index + 1) % VISUALIZER_STYLES.length];
}
