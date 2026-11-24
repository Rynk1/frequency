import { describe, it, expect, afterEach } from 'vitest';
import {
  getPreviewDurationSeconds,
  getPreviewLabel,
  setPreviewDurationOverride,
} from '../lib/usage/preview-config';

describe('preview length', () => {
  afterEach(() => setPreviewDurationOverride(null));

  it('defaults to three minutes', () => {
    expect(getPreviewDurationSeconds()).toBe(180);
    expect(getPreviewLabel()).toBe('3-MINUTE PREVIEW');
  });

  it('accepts a runtime override and formats the label', () => {
    setPreviewDurationOverride(240);
    expect(getPreviewDurationSeconds()).toBe(240);
    expect(getPreviewLabel()).toBe('4-MINUTE PREVIEW');

    setPreviewDurationOverride(90);
    expect(getPreviewLabel()).toBe('1.5-MINUTE PREVIEW');
  });

  it('ignores invalid overrides', () => {
    setPreviewDurationOverride(0);
    expect(getPreviewDurationSeconds()).toBe(180);
    setPreviewDurationOverride(-30);
    expect(getPreviewDurationSeconds()).toBe(180);
    setPreviewDurationOverride(Number.NaN);
    expect(getPreviewDurationSeconds()).toBe(180);
  });
});
