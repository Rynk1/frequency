import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Square, Play, Pause, Save, X, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { CustomAudioRecorder, RecordingResult } from '../lib/audio/CustomAudioRecorder';
import { globalCustomAudioOverlayEngine } from '../lib/audio/CustomAudioOverlayEngine';
import { UserAffirmationService } from '../lib/affirmations/user-affirmation-service';
import { AffirmationCategory, CATEGORY_LABELS } from '../types/affirmation';

interface RecordAffirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const RecordAffirmationModal: React.FC<RecordAffirmationModalProps> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const { colors, gradients, isDark } = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState<AffirmationCategory>('self_care');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<RecordingResult | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const recorderRef = useRef<CustomAudioRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      recorderRef.current = new CustomAudioRecorder();
      setTitle('');
      setText('');
      setCategory('self_care');
      setIsRecording(false);
      setRecordingSeconds(0);
      setRecordedAudio(null);
      setIsPlayingPreview(false);
    } else {
      stopRecordingTimer();
      globalCustomAudioOverlayEngine.stop();
    }
  }, [visible]);

  const startRecordingTimer = () => {
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      try {
        stopRecordingTimer();
        setIsRecording(false);
        if (recorderRef.current) {
          const result = await recorderRef.current.stopRecording();
          setRecordedAudio(result);
        }
      } catch (err: any) {
        Alert.alert('Recording Failed', err?.message || 'Unable to complete audio recording.');
      }
    } else {
      // Start recording
      try {
        if (isPlayingPreview) {
          await globalCustomAudioOverlayEngine.stop();
          setIsPlayingPreview(false);
        }
        if (recorderRef.current) {
          await recorderRef.current.startRecording();
          setIsRecording(true);
          startRecordingTimer();
        }
      } catch (err: any) {
        Alert.alert('Microphone Access Required', err?.message || 'Microphone access is needed to record your affirmation.');
      }
    }
  };

  const handleTogglePreview = async () => {
    if (!recordedAudio?.uri) return;

    if (isPlayingPreview) {
      await globalCustomAudioOverlayEngine.stop();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      await globalCustomAudioOverlayEngine.playOverlay(recordedAudio.uri, {
        onEnd: () => setIsPlayingPreview(false),
        onError: () => setIsPlayingPreview(false),
      });
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Affirmation Text Required', 'Please enter what you affirm in writing.');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Authentication Required', 'Please sign in to save your custom affirmation.');
      return;
    }

    try {
      setIsSaving(true);
      await globalCustomAudioOverlayEngine.stop();

      await UserAffirmationService.saveUserAffirmation(user.uid, {
        title: title.trim() || 'My Written Affirmation',
        text: text.trim(),
        category,
        audioUri: recordedAudio?.uri || null,
        audioBase64: recordedAudio?.base64 || null,
        durationSeconds: recordedAudio?.durationSeconds || recordingSeconds || 0,
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Failed to save custom affirmation.');
    } finally {
      setIsSaving(false);
    }
  };

  const categories: AffirmationCategory[] = [
    'confidence',
    'self_care',
    'focus',
    'relaxation',
    'gratitude',
    'resilience',
    'relationships',
    'financial_mindset',
    'creativity',
    'sleep_wind_down',
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
          <LinearGradient colors={gradients.bg} style={styles.gradient}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Sparkles color={colors.primary} size={22} />
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Record Affirmation
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title (Optional)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.textPrimary, backgroundColor: colors.glass, borderColor: colors.glassBorder },
                ]}
                placeholder="e.g. Morning Calm & Confidence"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />

              {/* Text / Note Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>What do you affirm in writing?</Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  { color: colors.textPrimary, backgroundColor: colors.glass, borderColor: colors.glassBorder },
                ]}
                placeholder="Write your affirmation here (e.g. 'I move through today with clarity, peace, and unhurried confidence.')"
                placeholderTextColor={colors.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={4}
                maxLength={300}
              />

              {/* Category Picker */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Intent Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected ? colors.primary + '25' : colors.glass,
                          borderColor: isSelected ? colors.primary : colors.glassBorder,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {CATEGORY_LABELS[cat]?.label || cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Recorder Audio Section */}
              <View style={[styles.recorderCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <Text style={[styles.recorderTitle, { color: colors.textPrimary }]}>Voice Audio (Optional)</Text>
                <Text style={[styles.recorderSub, { color: colors.textSecondary }]}>
                  Record yourself reading your affirmation to layer your own voice over playing frequency soundscapes.
                </Text>

                <View style={styles.recorderControls}>
                  <TouchableOpacity
                    style={[
                      styles.micButton,
                      isRecording && styles.micButtonActive,
                    ]}
                    onPress={handleToggleRecording}
                  >
                    {isRecording ? <Square color="#FFFFFF" size={26} /> : <Mic color="#FFFFFF" size={26} />}
                  </TouchableOpacity>

                  <Text style={[styles.timerText, { color: colors.textPrimary }]}>
                    {isRecording
                      ? `Recording... 00:${String(recordingSeconds).padStart(2, '0')}`
                      : recordedAudio
                      ? `Recorded (${recordedAudio.durationSeconds}s)`
                      : 'Tap mic to record voice'}
                  </Text>
                </View>

                {recordedAudio && !isRecording && (
                  <View style={styles.previewRow}>
                    <TouchableOpacity
                      style={[styles.previewButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                      onPress={handleTogglePreview}
                    >
                      {isPlayingPreview ? (
                        <Pause color={colors.primary} size={18} />
                      ) : (
                        <Play color={colors.primary} size={18} />
                      )}
                      <Text style={[styles.previewButtonText, { color: colors.primary }]}>
                        {isPlayingPreview ? 'Pause Voice Preview' : 'Play Voice Preview'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.savedBadge}>
                      <CheckCircle2 color={colors.accent} size={16} />
                      <Text style={[styles.savedBadgeText, { color: colors.accent }]}>Audio Ready</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Save color="#FFFFFF" size={20} />
                    <Text style={styles.saveButtonText}>Save Affirmation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
  },
  body: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textAreaInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  categoryChip: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recorderCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  recorderTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  recorderSub: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  recorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  micButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 12,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
