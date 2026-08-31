import React from 'react';
import { Stack, router } from 'expo-router';
import { AdminAuthProvider, useAdminAuth } from '@/hooks/useAdminAuth';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ShieldAlert, LogOut } from 'lucide-react-native';

function AdminLayoutContent() {
  const { isAuthenticated, isLoading, isUnauthorized, logout } = useAdminAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Verifying admin credentials...</Text>
      </View>
    );
  }

  if (!isAuthenticated && !isUnauthorized) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#080B16' },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  if (isUnauthorized) {
    return (
      <View style={styles.unauthorizedContainer}>
        <View style={styles.unauthorizedCard}>
          <ShieldAlert color="#F87171" size={48} />
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedDesc}>
            Your account does not have admin privileges. Admin access requires Firebase custom claims to be set.
          </Text>
          <Text style={styles.unauthorizedHint}>
            Contact your Firebase project owner or use the Firebase Admin SDK to assign the admin claim.
          </Text>
          <TouchableOpacity
            style={styles.unauthorizedBtn}
            onPress={async () => {
              await logout();
              router.replace('/admin/login' as any);
            }}
          >
            <LogOut color="#fff" size={16} />
            <Text style={styles.unauthorizedBtnText}>Return to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: '#111827',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="(dashboard)" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
}

export default function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent />
    </AdminAuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080B16',
    padding: 24,
  },
  unauthorizedCard: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 32,
    maxWidth: 380,
    width: '100%',
  },
  unauthorizedTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#F87171',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedDesc: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  unauthorizedHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  unauthorizedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  unauthorizedBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});