import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 * This prevents raw technical errors like "Firebase: Error (auth/operation-not-allowed)"
 * from reaching the user.
 */
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
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/internal-error': 'An internal error occurred. Please try again.',
  'auth/api-key-not-valid': 'Authentication service is not configured correctly. Please contact support.',
  'auth/app-not-authorized': 'This app is not authorized to use Firebase Authentication. Please check the Firebase configuration.',
  'auth/configuration-not-found': 'Authentication configuration not found. Please check the Firebase project settings.',
  'auth/invalid-api-key': 'The API key is invalid. Please check the Firebase configuration.',
  'auth/app-deleted': 'This app instance has been deleted.',
  'auth/missing-password': 'Please enter a password.',
  'auth/missing-email': 'Please enter an email address.',
};

/**
 * Converts a Firebase Auth error into a user-friendly Error.
 */
function mapAuthError(error: any): Error {
  const code = error?.code || '';
  const friendlyMessage = AUTH_ERROR_MESSAGES[code];
  if (friendlyMessage) {
    return new Error(friendlyMessage);
  }
  if (code.startsWith('auth/')) {
    const shortCode = code.replace('auth/', '');
    return new Error(`Authentication error (${shortCode}). Please try again.`);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Authentication failed. Please try again.');
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin?: boolean;
  customClaims?: Record<string, any>;
}

export const authService = {
  async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
    } catch (error: any) {
      throw mapAuthError(error);
    }
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
    } catch (error: any) {
      throw mapAuthError(error);
    }
  },

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      // Sign-out failures are non-critical — don't block the user
      console.warn('Sign-out error (non-fatal):', error?.code || error?.message);
      return;
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser || null;
  },

  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    try {
      return onAuthStateChanged(auth, (user) => {
        if (user) {
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          });
        } else {
          callback(null);
        }
      });
    } catch {
      callback(null);
      return () => {};
    }
  },

  /**
   * Check if user has admin custom claim.
   * Forces a fresh token from the server to ensure claims are current
   * (custom claims are embedded in the ID token and only refresh on sign-in
   * or explicit force-refresh).
   */
  async isAdmin(user: User | null, forceRefresh = true): Promise<boolean> {
    if (!user) return false;

    try {
      // forceRefresh=true ensures we get fresh claims from Firebase Auth server.
      // Without this, newly-set admin claims won't appear until sign-out/sign-in.
      const idTokenResult = await getIdTokenResult(user, forceRefresh);
      return idTokenResult.claims.admin === true;
    } catch (error: any) {
      // Network errors should not block admin check — fall back to cached
      if (error?.code === 'auth/network-request-failed' && !forceRefresh) {
        return false;
      }
      // If force-refresh fails, try once more with cached token as fallback
      if (forceRefresh) {
        try {
          const idTokenResult = await getIdTokenResult(user, false);
          return idTokenResult.claims.admin === true;
        } catch {
          return false;
        }
      }
      return false;
    }
  },

  async getUserWithAdminStatus(user: User): Promise<AuthUser> {
    try {
      // Force fresh token to get current admin claim status
      const idTokenResult = await getIdTokenResult(user, true);
      const isAdmin = idTokenResult.claims.admin === true;

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAdmin,
        customClaims: idTokenResult.claims
      };
    } catch {
      // Fall back to cached claims on network error
      try {
        const idTokenResult = await getIdTokenResult(user, false);
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAdmin: idTokenResult.claims.admin === true,
          customClaims: idTokenResult.claims
        };
      } catch {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAdmin: false
        };
      }
    }
  },

  async getIdToken(user: User | null): Promise<string | null> {
    if (!user) return null;

    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }
};