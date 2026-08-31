import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Settings,
  Bell,
  Lock,
  DollarSign,
  Globe,
  Database,
  Shield,
  Save,
  RefreshCw,
} from 'lucide-react-native';

const SETTINGS_KEY = 'adminAppSettings';

export default function SettingsManagement() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    enablePayments: true,
    premiumPrice: '29.99',
    currency: 'USD',
    trialDays: '7',
    defaultFreePremium: false,
    allowGuestAccess: true,
    maxSessionDuration: '60',
    enablePushNotifications: true,
    enableEmailNotifications: true,
    notificationFrequency: 'daily',
    requireStrongPassword: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch (e) {
        console.warn('Failed to load admin settings:', e);
      }
    })();
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      Alert.alert('Success', 'Settings saved successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 800));
      Alert.alert('Success', 'Settings synced with app successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to sync settings');
    } finally {
      setIsSyncing(false);
    }
  }, [settings]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings color="#8B5CF6" size={24} />
          <Text style={styles.sectionTitle}>App Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Maintenance Mode</Text>
            <Text style={styles.settingDescription}>
              Disable app access for users during maintenance
            </Text>
          </View>
          <Switch
            value={settings.maintenanceMode}
            onValueChange={(value) => setSettings({ ...settings, maintenanceMode: value })}
            trackColor={{ false: '#374151', true: '#8B5CF6' }}
            thumbColor={settings.maintenanceMode ? '#fff' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Allow Registration</Text>
            <Text style={styles.settingDescription}>
              Allow new users to register
            </Text>
          </View>
          <Switch
            value={settings.allowRegistration}
            onValueChange={(value) => setSettings({ ...settings, allowRegistration: value })}
            trackColor={{ false: '#374151', true: '#8B5CF6' }}
            thumbColor={settings.allowRegistration ? '#fff' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Verification</Text>
            <Text style={styles.settingDescription}>
              Require email verification for new accounts
            </Text>
          </View>
          <Switch
            value={settings.requireEmailVerification}
            onValueChange={(value) => setSettings({ ...settings, requireEmailVerification: value })}
            trackColor={{ false: '#374151', true: '#8B5CF6' }}
            thumbColor={settings.requireEmailVerification ? '#fff' : '#9CA3AF'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign color="#10B981" size={24} />
          <Text style={styles.sectionTitle}>Payment Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Payments</Text>
            <Text style={styles.settingDescription}>
              Allow users to purchase premium subscriptions
            </Text>
          </View>
          <Switch
            value={settings.enablePayments}
            onValueChange={(value) => setSettings({ ...settings, enablePayments: value })}
            trackColor={{ false: '#374151', true: '#10B981' }}
            thumbColor={settings.enablePayments ? '#fff' : '#9CA3AF'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Premium Price</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={settings.premiumPrice}
              onChangeText={(text) => setSettings({ ...settings, premiumPrice: text })}
              placeholder="29.99"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            <Text style={styles.inputSuffix}>{settings.currency}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Trial Period (days)</Text>
          <TextInput
            style={styles.input}
            value={settings.trialDays}
            onChangeText={(text) => setSettings({ ...settings, trialDays: text })}
            placeholder="7"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe color="#3B82F6" size={24} />
          <Text style={styles.sectionTitle}>Content Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Default Premium Content</Text>
            <Text style={styles.settingDescription}>
              Make all new content premium by default
            </Text>
          </View>
          <Switch
            value={settings.defaultFreePremium}
            onValueChange={(value) => setSettings({ ...settings, defaultFreePremium: value })}
            trackColor={{ false: '#374151', true: '#3B82F6' }}
            thumbColor={settings.defaultFreePremium ? '#fff' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Guest Access</Text>
            <Text style={styles.settingDescription}>
              Allow limited access without registration
            </Text>
          </View>
          <Switch
            value={settings.allowGuestAccess}
            onValueChange={(value) => setSettings({ ...settings, allowGuestAccess: value })}
            trackColor={{ false: '#374151', true: '#3B82F6' }}
            thumbColor={settings.allowGuestAccess ? '#fff' : '#9CA3AF'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Max Session Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={settings.maxSessionDuration}
            onChangeText={(text) => setSettings({ ...settings, maxSessionDuration: text })}
            placeholder="60"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell color="#F59E0B" size={24} />
          <Text style={styles.sectionTitle}>Notification Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Enable push notifications for users
            </Text>
          </View>
          <Switch
            value={settings.enablePushNotifications}
            onValueChange={(value) => setSettings({ ...settings, enablePushNotifications: value })}
            trackColor={{ false: '#374151', true: '#F59E0B' }}
            thumbColor={settings.enablePushNotifications ? '#fff' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingDescription}>
              Send email updates to users
            </Text>
          </View>
          <Switch
            value={settings.enableEmailNotifications}
            onValueChange={(value) => setSettings({ ...settings, enableEmailNotifications: value })}
            trackColor={{ false: '#374151', true: '#F59E0B' }}
            thumbColor={settings.enableEmailNotifications ? '#fff' : '#9CA3AF'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield color="#EF4444" size={24} />
          <Text style={styles.sectionTitle}>Security Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Strong Password</Text>
            <Text style={styles.settingDescription}>
              Require strong passwords for user accounts
            </Text>
          </View>
          <Switch
            value={settings.requireStrongPassword}
            onValueChange={(value) => setSettings({ ...settings, requireStrongPassword: value })}
            trackColor={{ false: '#374151', true: '#EF4444' }}
            thumbColor={settings.requireStrongPassword ? '#fff' : '#9CA3AF'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Session Timeout (minutes)</Text>
          <TextInput
            style={styles.input}
            value={settings.sessionTimeout}
            onChangeText={(text) => setSettings({ ...settings, sessionTimeout: text })}
            placeholder="30"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Max Login Attempts</Text>
          <TextInput
            style={styles.input}
            value={settings.maxLoginAttempts}
            onChangeText={(text) => setSettings({ ...settings, maxLoginAttempts: text })}
            placeholder="5"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync} disabled={isSyncing}>
          <LinearGradient
            colors={['#6B7280', '#4B5563']}
            style={styles.actionGradient}
          >
            <RefreshCw color="white" size={20} />
            <Text style={styles.actionText}>{isSyncing ? 'Syncing...' : 'Sync with App'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.actionGradient}
          >
            <Save color="white" size={20} />
            <Text style={styles.actionText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
    fontSize: 16,
  },
  inputSuffix: {
    color: '#9CA3AF',
    fontSize: 16,
    marginLeft: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  syncButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
