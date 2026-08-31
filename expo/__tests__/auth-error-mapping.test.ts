import { describe, it, expect } from 'vitest';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/operation-not-allowed': 'Email/Password sign-in is not enabled for this app. Please contact support.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email. Try signing up instead.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
  'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
};

function mapAuthError(code: string): string {
  return AUTH_ERROR_MESSAGES[code] || `Authentication error (${code.replace('auth/', '')}). Please try again.`;
}

describe('Firebase Auth Error Mapping', () => {
  it('maps raw invalid-credential error to friendly message', () => {
    const message = mapAuthError('auth/invalid-credential');
    expect(message).toBe('Invalid email or password. Please check your credentials.');
  });

  it('maps user-not-found error to friendly message', () => {
    const message = mapAuthError('auth/user-not-found');
    expect(message).toBe('No account found with this email. Try signing up instead.');
  });

  it('maps network failure error to friendly message', () => {
    const message = mapAuthError('auth/network-request-failed');
    expect(message).toBe('Network error. Please check your internet connection and try again.');
  });

  it('provides clean fallback for unknown auth error codes', () => {
    const message = mapAuthError('auth/unknown-error-code');
    expect(message).toBe('Authentication error (unknown-error-code). Please try again.');
  });
});
