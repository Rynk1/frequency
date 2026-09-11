import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';

type PrimaryGoal = 'focus' | 'sleep' | 'meditation' | 'healing';

const GOALS: { id: PrimaryGoal; title: string; description: string }[] = [
  { id: 'focus', title: 'Focus and clarity', description: 'Build a calm, attentive work rhythm.' },
  { id: 'sleep', title: 'Better sleep', description: 'Wind down and support restorative rest.' },
  { id: 'meditation', title: 'Meditation', description: 'Create space for stillness and reflection.' },
  { id: 'healing', title: 'General wellbeing', description: 'Explore a balanced daily practice.' },
];

const SESSION_LENGTHS = [10, 20, 30];

export default function OnboardingPage() {
  const { user, userProfile, updateProfile } = useAuth();
  const { updateSetting } = useSettings();
  const [goal, setGoal] = useState<PrimaryGoal>('focus');
  const [sessionLength, setSessionLength] = useState(20);
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return <Redirect href={'/' as any} />;
  if (userProfile?.onboardingCompleted) {
    return <Redirect href={'/(tabs)/categories' as any} />;
  }
  if (!userProfile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#A78BFA" size="large" />
      </View>
    );
  }

  const finishOnboarding = async () => {
    setIsSaving(true);
    try {
      updateSetting('defaultSessionLength', sessionLength);
      updateSetting('notifications', notifications);
      await updateProfile({
        onboardingCompleted: true,
        onboardingPreferences: {
          primaryGoal: goal,
          sessionLength,
          notifications,
        },
      });
      router.replace('/(tabs)/categories' as any);
    } catch (err) {
      console.error('Failed to finish onboarding:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>WELCOME TO FREQUENCY</Text>
        <Text style={styles.title}>Set up your first practice</Text>
        <Text style={styles.subtitle}>A few choices help us make your starting sessions feel useful from day one.</Text>

        <Text style={styles.sectionTitle}>What brings you here?</Text>
        <View style={styles.options}>
          {GOALS.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setGoal(option.id)}
              style={[styles.option, goal === option.id && styles.optionSelected]}
            >
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose a usual session length</Text>
        <View style={styles.lengthRow}>
          {SESSION_LENGTHS.map((length) => (
            <Pressable
              key={length}
              onPress={() => setSessionLength(length)}
              style={[styles.lengthOption, sessionLength === length && styles.lengthSelected]}
            >
              <Text style={styles.lengthText}>{length} min</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setNotifications((value) => !value)} style={styles.preferenceRow}>
          <View>
            <Text style={styles.optionTitle}>Practice reminders</Text>
            <Text style={styles.optionDescription}>Receive gentle reminders for your routine.</Text>
          </View>
          <View style={[styles.switch, notifications && styles.switchOn]}>
            <View style={[styles.switchThumb, notifications && styles.switchThumbOn]} />
          </View>
        </Pressable>

        <Pressable onPress={finishOnboarding} disabled={isSaving} style={styles.continueButton}>
          {isSaving ? <ActivityIndicator color="#0B1020" /> : <Text style={styles.continueText}>Begin my journey</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080B16' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080B16' },
  content: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', padding: 24, justifyContent: 'center' },
  eyebrow: { color: '#A78BFA', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginBottom: 10 },
  subtitle: { color: '#AAB1C5', fontSize: 16, lineHeight: 24, marginBottom: 28 },
  sectionTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  options: { gap: 10 },
  option: { borderWidth: 1, borderColor: '#28304A', borderRadius: 12, padding: 14, backgroundColor: '#11172A' },
  optionSelected: { borderColor: '#A78BFA', backgroundColor: '#1B1A38' },
  optionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  optionDescription: { color: '#9AA3BA', fontSize: 13, lineHeight: 19, marginTop: 4 },
  lengthRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  lengthOption: { flex: 1, borderWidth: 1, borderColor: '#28304A', borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: '#11172A' },
  lengthSelected: { borderColor: '#A78BFA', backgroundColor: '#1B1A38' },
  lengthText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#28304A', paddingVertical: 16, marginBottom: 18 },
  switch: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#28304A', padding: 3 },
  switchOn: { backgroundColor: '#8B7CF6' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  switchThumbOn: { alignSelf: 'flex-end' },
  continueButton: { backgroundColor: '#C4B5FD', borderRadius: 12, minHeight: 52, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  continueText: { color: '#0B1020', fontSize: 16, fontWeight: '700' },
});
