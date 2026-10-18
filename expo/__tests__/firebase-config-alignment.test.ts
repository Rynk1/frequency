import { describe, it, expect } from 'vitest';
import { defaultFirebaseProjectId } from '../lib/firebase';

describe('Firebase Project Configuration Alignment', () => {
  it('ensures the default production Firebase project ID is frequency-c6236 across environment fallbacks', () => {
    expect(defaultFirebaseProjectId).toBe('frequency-c6236');
  });
});
