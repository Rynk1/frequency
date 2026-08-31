import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { 
  Radio, 
  BookOpen, 
  Calendar, 
  Users, 
  Settings,
  LogOut,
  BarChart3
} from 'lucide-react-native';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useEffect } from 'react';

export default function DashboardLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('📊 Dashboard Layout - Auth Check:', { isAuthenticated, isLoading, userEmail: user?.email });
    
    if (!isLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login...');
      router.replace('/admin/login' as any);
    } else if (!isLoading && isAuthenticated && user) {
      console.log('✅ User authenticated in dashboard:', user.email);
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Not authorized. Redirecting...</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login' as any);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
        headerStyle: {
          backgroundColor: '#1F2937',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#374151',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userRole}>{user?.role?.replace('_', ' ')}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut color="#EF4444" size={20} />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
          headerTitle: 'Admin Dashboard',
        }}
      />
      <Tabs.Screen
        name="frequencies"
        options={{
          title: 'Frequencies',
          tabBarIcon: ({ color }) => <Radio color={color} size={24} />,
          headerTitle: 'Manage Frequencies',
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          headerTitle: 'Manage Sessions',
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: 'Learning',
          tabBarIcon: ({ color }) => <BookOpen color={color} size={24} />,
          headerTitle: 'Manage Learning Content',
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          headerTitle: 'User Management',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
          headerTitle: 'App Settings',
        }}
      />
    </Tabs>
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
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userRole: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'capitalize' as const,
  },
  logoutButton: {
    padding: 8,
  },
});