import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useAuth } from '@/hooks/useAuth';
import {
  X,
  Plus,
  Clock,
  Target,
  Calendar,
  Zap,
  Heart,
  Brain,
  Moon,
  Sparkles,
  ChevronRight,
  Bell,
  BellOff,
  Check,
  ChevronUp,
  ChevronDown,
  Music,
  Timer,
  Repeat,
} from 'lucide-react-native';
import {
  SOLFEGGIO_FREQUENCIES,
  CHAKRA_FREQUENCIES,
  BINAURAL_BEATS,
  HEALING_FREQUENCIES,
  SLEEP_FREQUENCIES,
  WEALTH_FREQUENCIES,
} from '@/constants/frequencies';
import { FONTS, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface CreateSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateSession: (session: any) => Promise<any>;
}

interface SelectedFrequency {
  hz: number;
  name: string;
  duration: number;
}

const categories = [
  { id: 'healing', name: 'Healing', icon: Heart, color: '#F472B6' },
  { id: 'meditation', name: 'Meditation', icon: Brain, color: '#A78BFA' },
  { id: 'sleep', name: 'Sleep', icon: Moon, color: '#60A5FA' },
  { id: 'focus', name: 'Focus', icon: Zap, color: '#34D399' },
  { id: 'manifestation', name: 'Manifestation', icon: Sparkles, color: '#FBBF24' },
];

const intensities = [
  { id: 'gentle', name: 'Gentle', emoji: '🌱', color: '#34D399' },
  { id: 'moderate', name: 'Moderate', emoji: '⚡', color: '#FBBF24' },
  { id: 'intense', name: 'Intense', emoji: '🔥', color: '#F472B6' },
];

const schedules = [
  'Daily',
  'Weekdays',
  'Weekends',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const allFrequencies = [
  ...SOLFEGGIO_FREQUENCIES.map(f => ({ ...f, category: 'Solfeggio' })),
  ...CHAKRA_FREQUENCIES.map(f => ({ ...f, category: 'Chakra' })),
  ...BINAURAL_BEATS.map(f => ({ ...f, category: 'Binaural' })),
  ...HEALING_FREQUENCIES.map(f => ({ ...f, category: 'Healing' })),
  ...SLEEP_FREQUENCIES.map(f => ({ ...f, category: 'Sleep' })),
  ...WEALTH_FREQUENCIES.map(f => ({ ...f, category: 'Wealth' })),
];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];



const GlassCard = SharedGlassCard;

export default function CreateSessionModal({ visible, onClose, onCreateSession }: CreateSessionModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, gradients, isDark } = useTheme();
  const { user } = useAuth();
  const { createReminder, requestNotificationPermission } = useSessionManager();
  const [sessionName, setSessionName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('healing');
  const [selectedIntensity, setSelectedIntensity] = useState('moderate');
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>(['Daily']);
  const [selectedFrequencies, setSelectedFrequencies] = useState<SelectedFrequency[]>([]);
  const [notes, setNotes] = useState('');
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [currentFrequencyDuration, setCurrentFrequencyDuration] = useState(10);
  const [freqFilterCat, setFreqFilterCat] = useState<string>('all');

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState('07');
  const [notifMinute, setNotifMinute] = useState('00');
  const [notifPeriod, setNotifPeriod] = useState('AM');

  const [step, setStep] = useState<1 | 2>(1);

  const totalDuration = selectedFrequencies.reduce((sum, f) => sum + f.duration, 0);
  const selectedCatMeta = categories.find(c => c.id === selectedCategory) || categories[0];

  const freqCategories = ['all', 'Solfeggio', 'Chakra', 'Binaural', 'Healing', 'Sleep', 'Wealth'];
  const filteredFreqs = freqFilterCat === 'all'
    ? allFrequencies
    : allFrequencies.filter(f => f.category === freqFilterCat);

  const handleAddFrequency = (frequency: any) => {
    const newFrequency: SelectedFrequency = {
      hz: frequency.hz,
      name: frequency.name,
      duration: currentFrequencyDuration,
    };
    setSelectedFrequencies([...selectedFrequencies, newFrequency]);
    setShowFrequencyPicker(false);
    setCurrentFrequencyDuration(10);
  };

  const handleRemoveFrequency = (index: number) => {
    setSelectedFrequencies(selectedFrequencies.filter((_, i) => i !== index));
  };

  const handleToggleSchedule = (day: string) => {
    if (selectedSchedule.includes(day)) {
      setSelectedSchedule(selectedSchedule.filter(d => d !== day));
    } else {
      setSelectedSchedule([...selectedSchedule, day]);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      Alert.alert('Missing Name', 'Please enter a session name to continue.');
      return;
    }
    if (selectedFrequencies.length === 0) {
      Alert.alert('No Frequencies', 'Please add at least one frequency to your session.');
      return;
    }

    const userId = user?.uid || '';

    const newSession = {
      name: sessionName,
      frequencies: selectedFrequencies,
      totalDuration,
      goal: goal || 'Personal growth and healing',
      schedule: selectedSchedule,
      progress: 0,
      totalSessions: 0,
      streak: 0,
      notes,
      category: selectedCategory,
      intensity: selectedIntensity,
      notificationEnabled: notificationsEnabled,
      notificationTime: notificationsEnabled ? `${notifHour}:${notifMinute} ${notifPeriod}` : null,
      notificationId: null,
      reminderId: null,
      type: 'custom' as const,
      userId,
    };

    try {
      const createdSession = await onCreateSession(newSession);
      if (!createdSession) {
        Alert.alert('Error', 'Failed to create session. Please try again.');
        return;
      }

      // Create reminder if notifications are enabled
      if (notificationsEnabled && createdSession.id) {
        try {
          const reminder = await createReminder(
            createdSession.id,
            sessionName,
            `${notifHour}:${notifMinute}`,
            notifPeriod as 'AM' | 'PM',
            selectedSchedule,
            userId
          );
          if (reminder) {
            console.log('[CreateSession] Reminder created:', reminder.id);
          }
        } catch (reminderErr) {
          console.error('[CreateSession] Failed to create reminder:', reminderErr);
        }
      }

      resetForm();
      onClose();
      Alert.alert(
        '✨ Session Created',
        `"${sessionName}" has been added to your active sessions.`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (e) {
      console.error('[CreateSession] Error:', e);
      Alert.alert('Error', 'Failed to create session. Please try again.');
    }
  };

  const resetForm = () => {
    setSessionName('');
    setGoal('');
    setSelectedCategory('healing');
    setSelectedIntensity('moderate');
    setSelectedSchedule(['Daily']);
    setSelectedFrequencies([]);
    setNotes('');
    setNotificationsEnabled(false);
    setNotifHour('07');
    setNotifMinute('00');
    setNotifPeriod('AM');
    setStep(1);
    setFreqFilterCat('all');
  };

  const canProceed = sessionName.trim().length > 0;
  const canCreate = canProceed && selectedFrequencies.length > 0;
  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={styles.bgOrb1} pointerEvents="none" />
        <View style={styles.bgOrb2} pointerEvents="none" />

        <View style={[styles.content, { paddingTop: insets.top + 8 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerEyebrow}>NEW SESSION</Text>
              <Text style={styles.title}>Create Session</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            <TouchableOpacity onPress={() => setStep(1)} style={[styles.stepItem, step === 1 && styles.stepItemActive]}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
                {step > 1 ? <Check size={10} color="#fff" /> : <Text style={styles.stepNum}>1</Text>}
              </View>
              <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Details</Text>
            </TouchableOpacity>
            <View style={styles.stepLine} />
            <TouchableOpacity onPress={() => canProceed && setStep(2)} style={[styles.stepItem, step === 2 && styles.stepItemActive]}>
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
                <Text style={styles.stepNum}>2</Text>
              </View>
              <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Schedule</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

            {step === 1 && (
              <>
                {/* Session Name */}
                <GlassCard style={styles.section} depth="normal">
                  <View style={styles.sectionHeaderRow}>
                    <Target size={15} color={selectedCatMeta.color} />
                    <Text style={styles.sectionTitle}>Session Details</Text>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Session Name <Text style={{ color: '#F472B6' }}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Morning Meditation"
                      placeholderTextColor={colors.textMuted}
                      value={sessionName}
                      onChangeText={setSessionName}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Intention / Goal</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="What do you want to achieve?"
                      placeholderTextColor={colors.textMuted}
                      value={goal}
                      onChangeText={setGoal}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </GlassCard>

                {/* Category */}
                <GlassCard style={styles.section} depth="normal">
                  <View style={styles.sectionHeaderRow}>
                    <Music size={15} color={colors.accent} />
                    <Text style={styles.sectionTitle}>Category</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryRow}
                  >
                    {categories.map(category => {
                      const IconComponent = category.icon;
                      const isSelected = selectedCategory === category.id;
                      return (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryChip,
                            isSelected && { backgroundColor: category.color + '22', borderColor: category.color + '60' }
                          ]}
                          onPress={() => setSelectedCategory(category.id)}
                        >
                          <View style={[styles.catChipIcon, { backgroundColor: isSelected ? category.color + '25' : 'rgba(255,255,255,0.06)' }]}>
                            <IconComponent size={14} color={isSelected ? category.color : colors.textMuted} />
                          </View>
                          <Text style={[styles.categoryChipName, isSelected && { color: category.color }]}>
                            {category.name}
                          </Text>
                          {isSelected && (
                            <View style={[styles.catCheckDot, { backgroundColor: category.color }]}>
                              <Check size={8} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </GlassCard>

                {/* Intensity */}
                <GlassCard style={styles.section} depth="normal">
                  <View style={styles.sectionHeaderRow}>
                    <Zap size={15} color={colors.gold} />
                    <Text style={styles.sectionTitle}>Intensity Level</Text>
                  </View>
                  <View style={styles.intensityRow}>
                    {intensities.map(intensity => {
                      const isSelected = selectedIntensity === intensity.id;
                      return (
                        <TouchableOpacity
                          key={intensity.id}
                          style={[
                            styles.intensityCard,
                            isSelected && { backgroundColor: intensity.color + '18', borderColor: intensity.color + '55' }
                          ]}
                          onPress={() => setSelectedIntensity(intensity.id)}
                        >
                          <Text style={styles.intensityEmoji}>{intensity.emoji}</Text>
                          <Text style={[
                            styles.intensityName,
                            isSelected && { color: intensity.color }
                          ]}>
                            {intensity.name}
                          </Text>
                          {isSelected && (
                            <View style={[styles.intensityActiveLine, { backgroundColor: intensity.color }]} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </GlassCard>

                {/* Frequencies */}
                <GlassCard style={styles.section} depth="normal">
                  <View style={styles.sectionHeaderRow}>
                    <Sparkles size={15} color={colors.accent} />
                    <Text style={styles.sectionTitle}>Frequencies <Text style={styles.requiredNote}>*</Text></Text>
                    <TouchableOpacity
                      style={styles.addFreqBtn}
                      onPress={() => setShowFrequencyPicker(true)}
                    >
                      <Plus size={13} color={colors.accent} />
                      <Text style={styles.addFreqBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedFrequencies.length === 0 ? (
                    <TouchableOpacity style={styles.emptyFreqArea} onPress={() => setShowFrequencyPicker(true)}>
                      <Music size={28} color={colors.textMuted} />
                      <Text style={styles.emptyFreqText}>Tap to add frequencies</Text>
                      <Text style={styles.emptyFreqSub}>Build your healing sequence</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.frequencyList}>
                      {selectedFrequencies.map((freq, index) => (
                        <View key={index} style={styles.frequencyItem}>
                          <View style={[styles.freqIndexBadge, { backgroundColor: selectedCatMeta.color + '20' }]}>
                            <Text style={[styles.freqIndexText, { color: selectedCatMeta.color }]}>{index + 1}</Text>
                          </View>
                          <View style={styles.frequencyInfo}>
                            <Text style={styles.frequencyName}>{freq.name}</Text>
                            <Text style={styles.frequencyHz}>{freq.hz} Hz · {freq.duration} min</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveFrequency(index)} style={styles.removeFreqBtn}>
                            <X size={14} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <View style={styles.totalDurationRow}>
                        <Timer size={13} color={colors.accent} />
                        <Text style={styles.totalDurationText}>Total duration: <Text style={{ color: colors.accent, fontWeight: '700' }}>{totalDuration} min</Text></Text>
                      </View>
                    </View>
                  )}
                </GlassCard>

                {/* Notes */}
                <GlassCard style={styles.section} depth="light">
                  <View style={styles.sectionHeaderRow}>
                    <Target size={15} color={colors.textMuted} />
                    <Text style={styles.sectionTitle}>Notes <Text style={styles.optionalNote}>(optional)</Text></Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any additional notes or intentions..."
                    placeholderTextColor={colors.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </GlassCard>

                <TouchableOpacity
                  style={[styles.nextBtn, !canProceed && styles.btnDisabled]}
                  onPress={() => canProceed && setStep(2)}
                  disabled={!canProceed}
                >
                  <LinearGradient
                    colors={canProceed ? ['rgba(108,99,255,0.9)', 'rgba(124,58,237,0.85)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                    style={styles.nextBtnGrad}
                  >
                    <Text style={[styles.nextBtnText, !canProceed && { color: colors.textMuted }]}>Continue to Schedule</Text>
                    <ChevronRight size={16} color={canProceed ? '#fff' : colors.textMuted} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                {/* Schedule Days */}
                <GlassCard style={styles.section} depth="normal">
                  <View style={styles.sectionHeaderRow}>
                    <Calendar size={15} color={colors.accent} />
                    <Text style={styles.sectionTitle}>Repeat Schedule</Text>
                  </View>
                  <View style={styles.scheduleGrid}>
                    {schedules.map(day => {
                      const isActive = selectedSchedule.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[styles.scheduleChip, isActive && { backgroundColor: selectedCatMeta.color + '20', borderColor: selectedCatMeta.color + '60' }]}
                          onPress={() => handleToggleSchedule(day)}
                        >
                          {isActive && <Check size={10} color={selectedCatMeta.color} />}
                          <Text style={[styles.scheduleChipText, isActive && { color: selectedCatMeta.color }]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </GlassCard>

                {/* Notification / Alarm */}
                <GlassCard style={styles.section} depth="normal">
                  <View style={styles.sectionHeaderRow}>
                    <Bell size={15} color={notificationsEnabled ? colors.gold : colors.textMuted} />
                    <Text style={styles.sectionTitle}>Session Reminder</Text>
                    <TouchableOpacity
                      style={[styles.notifToggle, notificationsEnabled && { backgroundColor: colors.gold + '20', borderColor: colors.gold + '50' }]}
                      onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                    >
                      {notificationsEnabled ? (
                        <Bell size={14} color={colors.gold} />
                      ) : (
                        <BellOff size={14} color={colors.textMuted} />
                      )}
                      <Text style={[styles.notifToggleText, notificationsEnabled && { color: colors.gold }]}>
                        {notificationsEnabled ? 'On' : 'Off'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {notificationsEnabled && (
                    <>
                      {Platform.OS === 'web' ? (
                        <View style={styles.webNotifNote}>
                          <Bell size={14} color={colors.textMuted} />
                          <Text style={styles.webNotifNoteText}>
                            Notifications available on iOS & Android devices
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.timePicker}>
                          <Text style={styles.timePickerLabel}>Reminder Time</Text>
                          <View style={styles.timePickerRow}>
                            {/* Hour */}
                            <View style={styles.timeColumn}>
                              <Text style={styles.timeColumnLabel}>Hour</Text>
                              <GlassCard style={styles.timeColumnCard} depth="light">
                                <ScrollView
                                  style={styles.timeScrollColumn}
                                  showsVerticalScrollIndicator={false}
                                  snapToInterval={40}
                                  decelerationRate="fast"
                                >
                                  {HOURS.map(h => (
                                    <TouchableOpacity
                                      key={h}
                                      style={[styles.timeItem, notifHour === h && styles.timeItemActive]}
                                      onPress={() => setNotifHour(h)}
                                    >
                                      <Text style={[styles.timeItemText, notifHour === h && styles.timeItemTextActive]}>{h}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </GlassCard>
                            </View>

                            <Text style={styles.timeSep}>:</Text>

                            {/* Minute */}
                            <View style={styles.timeColumn}>
                              <Text style={styles.timeColumnLabel}>Min</Text>
                              <GlassCard style={styles.timeColumnCard} depth="light">
                                {MINUTES.map(m => (
                                  <TouchableOpacity
                                    key={m}
                                    style={[styles.timeItem, notifMinute === m && styles.timeItemActive]}
                                    onPress={() => setNotifMinute(m)}
                                  >
                                    <Text style={[styles.timeItemText, notifMinute === m && styles.timeItemTextActive]}>{m}</Text>
                                  </TouchableOpacity>
                                ))}
                              </GlassCard>
                            </View>

                            {/* AM/PM */}
                            <View style={styles.timeColumn}>
                              <Text style={styles.timeColumnLabel}>Period</Text>
                              <GlassCard style={styles.timeColumnCard} depth="light">
                                {PERIODS.map(p => (
                                  <TouchableOpacity
                                    key={p}
                                    style={[styles.timeItem, notifPeriod === p && styles.timeItemActive]}
                                    onPress={() => setNotifPeriod(p)}
                                  >
                                    <Text style={[styles.timeItemText, notifPeriod === p && styles.timeItemTextActive]}>{p}</Text>
                                  </TouchableOpacity>
                                ))}
                              </GlassCard>
                            </View>
                          </View>

                          <View style={styles.timePreview}>
                            <Bell size={14} color={colors.gold} />
                            <Text style={styles.timePreviewText}>
                              You'll be reminded at{' '}
                              <Text style={{ color: colors.gold, fontWeight: '700' }}>
                                {notifHour}:{notifMinute} {notifPeriod}
                              </Text>
                              {' '}on{' '}
                              <Text style={{ color: colors.accent, fontWeight: '600' }}>
                                {selectedSchedule.join(', ')}
                              </Text>
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}

                  {!notificationsEnabled && (
                    <Text style={styles.notifHint}>
                      Enable to get alerted when your session is due
                    </Text>
                  )}
                </GlassCard>

                {/* Summary Card */}
                <GlassCard style={styles.summaryCard} depth="deep">
                  <LinearGradient
                    colors={[selectedCatMeta.color + '18', selectedCatMeta.color + '06', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    pointerEvents="none"
                  />
                  <View style={[styles.summaryTopAccent, { backgroundColor: selectedCatMeta.color + '60' }]} />
                  <Text style={styles.summaryTitle}>Session Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Name</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>{sessionName || '—'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Category</Text>
                    <Text style={[styles.summaryVal, { color: selectedCatMeta.color }]}>{selectedCategory}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Frequencies</Text>
                    <Text style={styles.summaryVal}>{selectedFrequencies.length} tracks</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Duration</Text>
                    <Text style={styles.summaryVal}>{totalDuration} min</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Schedule</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>{selectedSchedule.join(', ')}</Text>
                  </View>
                  {notificationsEnabled && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Reminder</Text>
                      <Text style={[styles.summaryVal, { color: colors.gold }]}>{notifHour}:{notifMinute} {notifPeriod}</Text>
                    </View>
                  )}
                </GlassCard>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                    <ChevronRight size={16} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createButton, !canCreate && styles.btnDisabled]}
                    onPress={handleCreateSession}
                    disabled={!canCreate}
                  >
                    <LinearGradient
                      colors={canCreate ? [selectedCatMeta.color, selectedCatMeta.color + 'CC'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                      style={styles.createBtnGrad}
                    >
                      <Check size={16} color={canCreate ? '#fff' : colors.textMuted} />
                      <Text style={[styles.createButtonText, !canCreate && { color: colors.textMuted }]}>
                        Create Session
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        {/* Frequency Picker Modal */}
        {showFrequencyPicker && (
          <Modal
            visible={showFrequencyPicker}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowFrequencyPicker(false)}
          >
            <View style={styles.pickerContainer}>
              <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <View style={styles.bgOrb1} pointerEvents="none" />

              <View style={[styles.pickerContent, { paddingTop: insets.top + 8 }]}>
                <View style={styles.pickerHeader}>
                  <View>
                    <Text style={styles.pickerEyebrow}>ADD FREQUENCY</Text>
                    <Text style={styles.pickerTitle}>Select Frequency</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowFrequencyPicker(false)} style={styles.closeButton}>
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Duration selector */}
                <GlassCard style={styles.durationCard} depth="normal">
                  <View style={styles.sectionHeaderRow}>
                    <Timer size={14} color={colors.accent} />
                    <Text style={styles.sectionTitle}>Duration per frequency</Text>
                  </View>
                  <View style={styles.durationRow}>
                    {[5, 10, 15, 20, 30].map(duration => (
                      <TouchableOpacity
                        key={duration}
                        style={[styles.durationChip, currentFrequencyDuration === duration && styles.durationChipActive]}
                        onPress={() => setCurrentFrequencyDuration(duration)}
                      >
                        <Text style={[styles.durationChipText, currentFrequencyDuration === duration && styles.durationChipTextActive]}>
                          {duration}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GlassCard>

                {/* Category filter */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.freqCatScroll}
                  contentContainerStyle={styles.freqCatScrollContent}
                >
                  {freqCategories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.freqCatChip, freqFilterCat === cat && styles.freqCatChipActive]}
                      onPress={() => setFreqFilterCat(cat)}
                    >
                      <Text style={[styles.freqCatChipText, freqFilterCat === cat && styles.freqCatChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {filteredFreqs.map((freq, index) => (
                    <TouchableOpacity
                      key={`${freq.hz}-${index}`}
                      onPress={() => handleAddFrequency(freq)}
                    >
                      <GlassCard style={styles.frequencyOptionCard} depth="light">
                        <View style={[styles.freqOptionHz, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.freqOptionHzText, { color: colors.accent }]}>{freq.hz}</Text>
                          <Text style={styles.freqOptionHzUnit}>Hz</Text>
                        </View>
                        <View style={styles.freqOptionInfo}>
                          <Text style={styles.frequencyOptionName}>{freq.name}</Text>
                          <Text style={styles.frequencyOptionDetails}>{freq.category}</Text>
                        </View>
                        <View style={styles.freqAddBtn}>
                          <Plus size={14} color={colors.accent} />
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                  <View style={{ height: 60 }} />
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bgOrb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(108,99,255,0.1)',
    top: -60,
    right: -80,
  },
  bgOrb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(167,139,250,0.07)',
    bottom: 100,
    left: -60,
  },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  headerLeft: { flex: 1 },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
    marginBottom: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorder : 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepItemActive: {},
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorder : 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: isDark ? colors.accentSoft : 'rgba(108,99,255,0.25)',
    borderColor: isDark ? colors.glassBorderBright : 'rgba(108,99,255,0.5)',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 12,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 22 },
  // Section
  section: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
    letterSpacing: 0.15,
  },
  requiredNote: {
    color: '#F472B6',
    fontSize: 13,
  },
  optionalNote: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '400' as const,
  },
  // Input
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  input: {
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorder : 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.03)',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
    paddingTop: 13,
  },
  // Category
  categoryRow: {
    gap: 8,
    paddingBottom: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    gap: 7,
    position: 'relative' as const,
    marginRight: 2,
  },
  catChipIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  catCheckDot: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  // Intensity
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intensityCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    gap: 5,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  intensityEmoji: {
    fontSize: 22,
  },
  intensityName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  intensityActiveLine: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  // Frequency
  addFreqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorderBright : 'rgba(167,139,250,0.3)',
  },
  addFreqBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  emptyFreqArea: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyFreqText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  emptyFreqSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  frequencyList: { gap: 8 },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 10,
  },
  freqIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqIndexText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  frequencyInfo: { flex: 1 },
  frequencyName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  frequencyHz: {
    fontSize: 11,
    color: colors.textMuted,
  },
  removeFreqBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 4,
  },
  totalDurationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Schedule
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  scheduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    gap: 5,
  },
  scheduleChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  // Notification
  notifToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  notifToggleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  notifHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  webNotifNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginTop: 4,
  },
  webNotifNoteText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  // Time Picker
  timePicker: { marginTop: 8 },
  timePickerLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  timeColumnLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  timeColumnCard: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden' as const,
    paddingVertical: 4,
  },
  timeScrollColumn: {
    maxHeight: 160,
  },
  timeItem: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 4,
    marginVertical: 1,
  },
  timeItemActive: {
    backgroundColor: isDark ? colors.accentSoft : 'rgba(108,99,255,0.3)',
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorderBright : 'rgba(108,99,255,0.5)',
  },
  timeItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  timeItemTextActive: {
    color: colors.accent,
    fontWeight: '700' as const,
  },
  timeSep: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textMuted,
    marginTop: 42,
  },
  timePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.goldGlow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  timePreviewText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  // Summary
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  summaryTopAccent: {
    position: 'absolute' as const,
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
  },
  summaryTitle: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  summaryKey: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  summaryVal: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600' as const,
    maxWidth: '60%',
    textAlign: 'right' as const,
  },
  // Navigation
  nextBtn: {
    borderRadius: 18,
    overflow: 'hidden' as const,
    marginBottom: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  nextBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  createButton: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden' as const,
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  createBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  // Frequency picker
  pickerContainer: { flex: 1, backgroundColor: colors.bg },
  pickerContent: {
    flex: 1,
    paddingHorizontal: 22,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
  },
  pickerEyebrow: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
    marginBottom: 3,
  },
  pickerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  durationCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: isDark ? colors.accentSoft : 'rgba(108,99,255,0.2)',
    borderColor: isDark ? colors.glassBorderBright : 'rgba(108,99,255,0.5)',
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  durationChipTextActive: {
    color: colors.accent,
  },
  freqCatScroll: { marginBottom: 14 },
  freqCatScrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  freqCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    marginRight: 6,
  },
  freqCatChipActive: {
    backgroundColor: isDark ? colors.accentSoft : 'rgba(108,99,255,0.2)',
    borderColor: isDark ? colors.glassBorderBright : 'rgba(108,99,255,0.5)',
  },
  freqCatChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  freqCatChipTextActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  frequencyOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
  },
  freqOptionHz: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  freqOptionHzText: {
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  freqOptionHzUnit: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  freqOptionInfo: { flex: 1 },
  frequencyOptionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  frequencyOptionDetails: {
    fontSize: 12,
    color: colors.textMuted,
  },
  freqAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: isDark ? colors.glassBorderBright : 'rgba(167,139,250,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
