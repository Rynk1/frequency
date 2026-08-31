import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, CheckCircle, XCircle, AlertTriangle, ArrowRight, RefreshCw, Key } from 'lucide-react-native';
import { auth } from '@/lib/firebase';
import { authService } from '@/lib/firebase-auth';

type SetupStep = 'checking' | 'not-signed-in' | 'no-admin-claim' | 'ready-to-setup' | 'setting-up' | 'done' | 'error';

interface BackendStatus {
  firebaseAdminAvailable: boolean;
  canBootstrapAdmin: boolean;
  message: string;
}

export default function SetupPage() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<SetupStep>('checking');
  const [setupKey, setSetupKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check current state on mount
  useEffect(() => {
    checkState();
  }, []);

  const checkState = useCallback(async () => {
    setStep('checking');
    setErrorMessage('');

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      setStep('not-signed-in');
      return;
    }

    setUserEmail(currentUser.email || '');

    // Check if already admin
    const alreadyAdmin = await authService.isAdmin(currentUser, true);
    if (alreadyAdmin) {
      setIsAdmin(true);
      setStep('done');
      return;
    }

    setIsAdmin(false);
    setStep('no-admin-claim');
  }, []);

  const checkBackendStatus = useCallback(async (url: string) => {
    try {
      const base = url.replace(/\/$/, '');
      const res = await fetch(`${base}/admin/status`);
      const data: BackendStatus = await res.json();
      setBackendStatus(data);
      return data;
    } catch {
      setBackendStatus({
        firebaseAdminAvailable: false,
        canBootstrapAdmin: false,
        message: 'Cannot reach backend. Deploy the Hono server first.',
      });
      return null;
    }
  }, []);

  const handleSetupAdmin = useCallback(async () => {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      setErrorMessage('You must be signed in first.');
      setStep('not-signed-in');
      return;
    }

    const key = setupKey.trim();
    const url = backendUrl.trim().replace(/\/$/, '');

    if (!key) {
      Alert.alert('Setup Key Required', 'Enter the ADMIN_SECRET_KEY configured on your backend server.');
      return;
    }

    if (!url) {
      Alert.alert('Backend URL Required', 'Enter the URL where your Hono backend is deployed (e.g. https://your-app.vercel.app).');
      return;
    }

    setStep('setting-up');
    setErrorMessage('');

    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/setAdminClaim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ email: currentUser.email, claims: { admin: true } }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.detail || data?.error || `Server returned ${res.status}`);
        setStep('error');
        return;
      }

      setStep('done');
      Alert.alert(
        'Admin Claim Set',
        `Your account (${currentUser.email}) now has admin privileges.\n\nIMPORTANT: You must sign out and sign back in for the claim to take effect.`,
        [
          {
            text: 'Sign Out Now',
            style: 'destructive',
            onPress: async () => {
              await authService.signOut();
              router.replace('/admin/login' as any);
            },
          },
          { text: 'Later', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      setErrorMessage(error?.message || 'Network error — is the backend deployed and reachable?');
      setStep('error');
    }
  }, [setupKey, backendUrl]);

  // ── Render helpers ──

  const renderStatusBadge = (ok: boolean, label: string) => (
    <View style={styles.statusRow}>
      {ok ? (
        <CheckCircle size={18} color="#10B981" />
      ) : (
        <XCircle size={18} color="#EF4444" />
      )}
      <Text style={[styles.statusLabel, { color: ok ? '#10B981' : '#EF4444' }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Admin Setup',
          headerStyle: { backgroundColor: '#080B16' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
        }}
      />
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top + 20 }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Shield size={28} color="#8B5CF6" />
          </View>
          <Text style={styles.title}>Admin Account Setup</Text>
          <Text style={styles.subtitle}>
            Configure the first admin account to access the management dashboard.
          </Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepsContainer}>
          {renderStatusBadge(step === 'done', '1. Firebase Account Signed In')}
          <View style={[styles.stepLine, { backgroundColor: step === 'done' ? '#10B981' : '#374151' }]} />
          {renderStatusBadge(step === 'done', '2. Admin Claim Configured')}
          <View style={[styles.stepLine, { backgroundColor: step === 'done' ? '#10B981' : '#374151' }]} />
          {renderStatusBadge(false, '3. Sign Out & Sign Back In')}
        </View>

        {/* Content by step */}
        {step === 'checking' && (
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Checking your account status...</Text>
          </View>
        )}

        {step === 'not-signed-in' && (
          <View style={styles.card}>
            <AlertTriangle size={32} color="#F59E0B" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.cardTitle}>Not Signed In</Text>
            <Text style={styles.cardText}>
              You need a Firebase account before setting up admin privileges. Sign up or sign in through the app first.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace('/admin/login' as any)}
            >
              <Text style={styles.primaryBtnText}>Go to Login</Text>
              <ArrowRight size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === 'no-admin-claim' && (
          <View style={styles.card}>
            <AlertTriangle size={32} color="#F59E0B" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.cardTitle}>No Admin Access</Text>
            <Text style={styles.cardText}>
              Your account ({userEmail}) is signed in but does not have admin privileges.
              Use the form below to grant yourself admin access.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Backend URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-backend.vercel.app"
              placeholderTextColor="#6B7280"
              value={backendUrl}
              onChangeText={setBackendUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => backendUrl.trim() && checkBackendStatus(backendUrl.trim())}
            >
              <RefreshCw size={14} color="#8B5CF6" />
              <Text style={styles.linkBtnText}>Check Backend Status</Text>
            </TouchableOpacity>

            {backendStatus && (
              <View style={styles.statusCard}>
                <Text style={styles.statusCardTitle}>Backend Status:</Text>
                {renderStatusBadge(backendStatus.firebaseAdminAvailable, 'Firebase Admin SDK loaded')}
                {renderStatusBadge(backendStatus.canBootstrapAdmin, 'ADMIN_SECRET_KEY configured')}
                <Text style={styles.statusMessage}>{backendStatus.message}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Setup Key (ADMIN_SECRET_KEY)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the secret key from your backend env"
              placeholderTextColor="#6B7280"
              value={setupKey}
              onChangeText={setSetupKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, (!setupKey.trim() || !backendUrl.trim()) && styles.primaryBtnDisabled]}
              onPress={handleSetupAdmin}
              disabled={!setupKey.trim() || !backendUrl.trim()}
            >
              <Key size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Grant Admin Access</Text>
            </TouchableOpacity>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <XCircle size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>
        )}

        {step === 'setting-up' && (
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Setting admin claim on your account...</Text>
            <Text style={styles.loadingSubtext}>Contacting backend server</Text>
          </View>
        )}

        {step === 'done' && (
          <View style={styles.card}>
            <CheckCircle size={48} color="#10B981" style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.cardTitle}>Admin Access Granted</Text>
            <Text style={styles.cardText}>
              Your account ({userEmail}) now has admin privileges.
            </Text>

            <View style={styles.warningBox}>
              <AlertTriangle size={18} color="#F59E0B" />
              <Text style={styles.warningText}>
                You must sign out and sign back in for the admin claim to take effect on your current session.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={async () => {
                await authService.signOut();
                router.replace('/admin/login' as any);
              }}
            >
              <Text style={styles.primaryBtnText}>Sign Out & Try Admin Login</Text>
              <ArrowRight size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === 'error' && (
          <View style={styles.card}>
            <XCircle size={32} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.cardTitle}>Setup Failed</Text>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={checkState}
            >
              <RefreshCw size={14} color="#8B5CF6" />
              <Text style={styles.secondaryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Manual setup instructions */}
        <View style={styles.manualSection}>
          <Text style={styles.manualTitle}>Manual Setup (Alternative)</Text>
          <Text style={styles.manualText}>
            If you prefer to set up admin claims manually via the Firebase CLI:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {'# 1. Install Firebase CLI\n'}
              {'npm install -g firebase-tools\n\n'}
              {'# 2. Login\n'}
              {'firebase login\n\n'}
              {'# 3. Set admin claim (replace UID)\n'}
              {'firebase auth:set-custom-user-claims USER_UID_HERE \'{"admin":true}\'\n\n'}
              {'# 4. Verify\n'}
              {'firebase auth:get-custom-user-claims USER_UID_HERE'}
            </Text>
          </View>
          <Text style={styles.manualText}>
            After setting the claim manually, sign out and back in on the app — the admin dashboard will then be accessible.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#080B16',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1F1A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8B5CF620',
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  stepsContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  stepLine: {
    width: 2,
    height: 16,
    marginLeft: 8,
    backgroundColor: '#374151',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 12,
  },
  secondaryBtnText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  linkBtnText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  statusCard: {
    backgroundColor: '#1A1F2E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 14,
    marginBottom: 12,
  },
  statusCardTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1F1525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF444430',
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FCA5A5',
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1F1A10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B30',
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FCD34D',
    lineHeight: 18,
  },
  manualSection: {
    marginTop: 8,
    marginBottom: 40,
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  manualText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: '#0D1117',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 12,
    color: '#8B949E',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
