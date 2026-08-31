import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { FONTS, COLORS } from '@/constants/theme';

interface AuthScreenProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ mode, onToggleMode }) => {
  const { signIn, signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'signin' 
                  ? 'Sign in to continue your frequency journey'
                  : 'Join thousands discovering healing frequencies'
                }
              </Text>
            </View>

            <View style={styles.form}>
              {mode === 'signup' && (
                <View style={styles.inputContainer}>
                  <User color="#666" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#999"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                    testID="displayName-input"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Mail color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="email-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  testID="password-input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  testID="toggle-password"
                >
                  {showPassword ? (
                    <EyeOff color="#666" size={20} />
                  ) : (
                    <Eye color="#666" size={20} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                testID="submit-button"
              >
                <Text style={styles.submitButtonText}>
                  {isLoading 
                    ? 'Please wait...' 
                    : mode === 'signin' 
                      ? 'Sign In' 
                      : 'Create Account'
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={onToggleMode}
                testID="toggle-mode"
              >
                <Text style={styles.toggleButtonText}>
                  {mode === 'signin' 
                    ? "Don't have an account? Sign Up"
                    : "Already have an account? Sign In"
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 32,
    fontWeight: '400' as const,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    fontFamily: FONTS.body,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontFamily: FONTS.body,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontFamily: FONTS.body,
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
});