export type TelemetryEventName =
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'preview_started'
  | 'preview_completed'
  | 'trial_started'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'free_today_played'
  | 'trial_reminder_scheduled';

export type TelemetryProps = Record<string, string | number | boolean | null | undefined>;

type TelemetrySink = (name: TelemetryEventName, props: TelemetryProps) => void;

let sink: TelemetrySink | null = null;

/**
 * The app has no product analytics provider wired yet. Events go to this
 * seam so the funnel is defined and testable; connect a provider here rather
 * than sprinkling calls through the UI.
 */
export function setTelemetrySink(next: TelemetrySink | null): void {
  sink = next;
}

export function track(name: TelemetryEventName, props: TelemetryProps = {}): void {
  try {
    if (sink) sink(name, props);
  } catch {
    // Telemetry must never break a purchase or a playback action.
  }
}
