import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService } from '@/lib/firebase-auth';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthorized' | 'unauthenticated';

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isUnauthorized: boolean;
  /** Detailed status for nuanced UI states */
  status: AuthStatus;
  /** Human-readable reason when unauthorized (e.g. 'token_expired', 'no_claim', 'firestore_unavailable') */
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Force a fresh admin claim check against the Firebase Auth server */
  refreshAdminStatus: () => Promise<void>;
}

/**
 * Verifies the current Firebase user has admin custom claims.
 * Forces a fresh token from the server every time — Firebase custom claims
 * are embedded in the ID token and don't update until force-refreshed.
 */
const verifyAdminAndBuildUser = async (firebaseUser: import('firebase/auth').User): Promise<AdminUser | null> => {
  // Force-refresh the ID token to get current claims.
  // Without this, newly-set admin claims won't appear until sign-out/sign-in.
  const isAdmin = await authService.isAdmin(firebaseUser, true);
  if (!isAdmin) return null;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || 'Admin',
    role: 'admin',
    permissions: ['all'],
  };
};

export const [AdminAuthProvider, useAdminAuth] = createContextHook<AdminAuthState>(() => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const status: AuthStatus = isLoading
    ? 'loading'
    : user
      ? 'authenticated'
      : isUnauthorized
        ? 'unauthorized'
        : 'unauthenticated';

  /**
   * Core admin verification: takes a Firebase user, verifies admin claim,
   * and updates all state accordingly.
   */
  const processFirebaseUser = useCallback(async (firebaseUser: import('firebase/auth').User | null) => {
    if (!firebaseUser) {
      setUser(null);
      setIsUnauthorized(false);
      setAuthError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const adminUser = await verifyAdminAndBuildUser(firebaseUser);
      if (adminUser) {
        setUser(adminUser);
        setIsUnauthorized(false);
        setAuthError(null);
      } else {
        setUser(null);
        setIsUnauthorized(true);
        setAuthError('no_admin_claim');
        // Sign out the non-admin user from Firebase to prevent stale sessions
        await signOut(auth).catch(() => {});
      }
    } catch (error: any) {
      setUser(null);
      setIsUnauthorized(true);
      // Distinguish between network errors and actual permission issues
      if (error?.code === 'auth/network-request-failed') {
        setAuthError('network_error');
      } else if (error?.code === 'auth/user-token-expired') {
        setAuthError('token_expired');
      } else {
        setAuthError('verification_failed');
      }
      await signOut(auth).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for Firebase auth state changes and verify admin claims on every change
  useEffect(() => {
    let mounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mounted) return;

      if (debounceTimer) clearTimeout(debounceTimer);

      // Debounce to avoid rapid claim verification on auth state flickers
      debounceTimer = setTimeout(() => {
        if (!mounted) return;
        processFirebaseUser(firebaseUser);
      }, 300);
    });

    return () => {
      mounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [processFirebaseUser]);

  /** Force a fresh admin status check (useful after claim changes) */
  const refreshAdminStatus = useCallback(async () => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return;
    await processFirebaseUser(currentUser);
  }, [processFirebaseUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Input validation
    const sanitizedEmail = email?.trim();
    const sanitizedPassword = password?.trim();

    if (!sanitizedEmail || sanitizedEmail.length > 100) return false;
    if (!sanitizedPassword || sanitizedPassword.length > 100) return false;
    if (!auth) return false;

    setIsLoading(true);
    setAuthError(null);

    try {
      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);

      // Step 2: Force-refresh token and verify admin claim
      // The onAuthStateChanged listener will also fire, but we do an explicit
      // check here so the caller gets a definite answer.
      const adminUser = await verifyAdminAndBuildUser(userCredential.user);

      if (!adminUser) {
        // Not an admin — sign out and signal failure
        await signOut(auth).catch(() => {});
        setUser(null);
        setIsUnauthorized(true);
        setAuthError('no_admin_claim');
        setIsLoading(false);
        return false;
      }

      // Admin verified — state will be set by the auth listener too
      setUser(adminUser);
      setIsUnauthorized(false);
      setAuthError(null);
      return true;
    } catch (error: any) {
      // Distinguish common errors
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
        setAuthError('invalid_credentials');
      } else if (error?.code === 'auth/network-request-failed') {
        setAuthError('network_error');
      } else if (error?.code === 'auth/too-many-requests') {
        setAuthError('rate_limited');
      } else {
        setAuthError('login_failed');
      }
      await signOut(auth).catch(() => {});
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsUnauthorized(false);
      setAuthError(null);
    }
  }, []);

  return useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    isUnauthorized,
    status,
    authError,
    login,
    logout,
    refreshAdminStatus,
  }), [user, isLoading, isUnauthorized, status, authError, login, logout, refreshAdminStatus]);
});