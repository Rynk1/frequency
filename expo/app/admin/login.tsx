import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Mail } from 'lucide-react-native';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔑 Attempting login for:', email);
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ Login successful, navigating to dashboard...');
        setTimeout(() => {
          router.replace('/admin/(dashboard)' as any);
        }, 1500);
      } else {
        console.log('❌ Login failed - not admin or invalid credentials');
        Alert.alert(
          'Login Failed',
          'Invalid email, password, or you do not have admin privileges. Please use the setup page (/setup) to grant admin access first.'
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      console.error('🔥 Login error:', error);
      Alert.alert(
        'Error',
        `Login failed: ${errorMessage}. Please check your internet connection and try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1F2937', '#111827', '#030712']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.logo}
                >
                  <Text style={styles.logoText}>FA</Text>
                </LinearGradient>
              </View>
              <Text style={styles.title}>Admin Dashboard</Text>
              <Text style={styles.subtitle}>Frequency Therapy Management</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Mail color="#9CA3AF" size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#9CA3AF" size={20} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.loginGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginText}>Login to Dashboard</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Admin Access Required</Text>
                <Text style={styles.credentialText}>Use your Firebase account credentials</Text>
                <Text style={styles.credentialText}>Admin privileges must be granted first</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  input: {
    flex: 1,
    height: 50,
    marginLeft: 12,
    color: 'white',
    fontSize: 16,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  credentialText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 4,
  },
});