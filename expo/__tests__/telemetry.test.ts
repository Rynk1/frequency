import { describe, it, expect, afterEach } from 'vitest';
import { setTelemetrySink, track } from '../lib/telemetry';

describe('telemetry seam', () => {
  afterEach(() => setTelemetrySink(null));

  it('forwards events and properties to the sink', () => {
    const events: Array<{ name: string; props: Record<string, unknown> }> = [];
    setTelemetrySink((name, props) => events.push({ name, props }));
    track('paywall_viewed', { trigger: 'duration_limit', intent: 'sleep' });
    expect(events).toEqual([
      { name: 'paywall_viewed', props: { trigger: 'duration_limit', intent: 'sleep' } },
    ]);
  });

  it('does nothing when no sink is connected', () => {
    expect(() => track('trial_started', { plan: 'yearly' })).not.toThrow();
  });

  it('never lets a broken sink break the caller', () => {
    setTelemetrySink(() => {
      throw new Error('provider down');
    });
    expect(() => track('purchase_completed', { plan: 'monthly' })).not.toThrow();
  });
});
