import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { GlassCard } from './GlassCard';
import {
  Volume2,
  ChevronRight,
  ChevronLeft,
  Eye,
  VolumeX,
  Sparkles,
  RefreshCw,
  XCircle,
  Sliders,
} from 'lucide-react-native';
import {
  Affirmation,
  AffirmationCategory,
  AffirmationMode,
  CATEGORY_LABELS,
} from '../types/affirmation';
import { AffirmationService } from '../lib/affirmations/affirmation-service';
import { globalSpeechEngine } from '../lib/audio/AffirmationSpeechEngine';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

interface AffirmationStreamCardProps {
  frequencyId?: string;
  sessionContext?: string;
  initialIntention?: AffirmationCategory;
  isPlaying?: boolean;
  mode: AffirmationMode;
  onModeChange: (mode: AffirmationMode) => void;
  speechVolume: number;
  onSpeechVolumeChange: (volume: number) => void;
  onActiveAffirmationChange?: (affirmation: Affirmation | null) => void;
}

const CATEGORIES: AffirmationCategory[] = [
  'confidence',
  'relationships',
  'financial_mindset',
  'self_care',
  'focus',
  'creativity',
  'relaxation',
  'sleep_wind_down',
  'gratitude',
  'resilience',
];

export const AffirmationStreamCard: React.FC<AffirmationStreamCardProps> = ({
  frequencyId,
  sessionContext = 'reflection',
  initialIntention = 'confidence',
  isPlaying = false,
  mode,
  onModeChange,
  speechVolume,
  onSpeechVolumeChange,
  onActiveAffirmationChange,
}) => {
  const { colors } = useTheme();
  const [selectedIntention, setSelectedIntention] = useState<AffirmationCategory>(initialIntention);
  const [activeAffirmation, setActiveAffirmation] = useState<Affirmation | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [rotationInterval, setRotationInterval] = useState<number>(30); // seconds
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);

  // Fetch eligible affirmations for current query
  const query = {
    intentionCategory: selectedIntention,
    frequencyId,
    sessionContext,
  };

  const eligibleList = AffirmationService.getEligibleAffirmations(query);

  // Synchronize active affirmation deterministically
  useEffect(() => {
    if (mode === 'off') {
      globalSpeechEngine.stop();
      setActiveAffirmation(null);
      if (onActiveAffirmationChange) onActiveAffirmationChange(null);
      return;
    }

    if (eligibleList.length > 0) {
      if (!activeAffirmation || !eligibleList.some((item) => item.id === activeAffirmation.id)) {
        const nextDefault = eligibleList[0];
        setActiveAffirmation(nextDefault);
        if (onActiveAffirmationChange) onActiveAffirmationChange(nextDefault);
      }
    } else {
      globalSpeechEngine.stop();
      setActiveAffirmation(null);
      if (onActiveAffirmationChange) onActiveAffirmationChange(null);
    }
  }, [mode, selectedIntention, frequencyId, sessionContext]);

  // Handle spoken audio triggering — only speaks when frequency playback is active
  useEffect(() => {
    if (isPlaying && (mode === 'spoken' || mode === 'both') && activeAffirmation) {
      globalSpeechEngine.speak(activeAffirmation.text, { volume: speechVolume });
    } else {
      globalSpeechEngine.stop();
    }
    return () => {
      globalSpeechEngine.stop();
    };
  }, [isPlaying, mode, activeAffirmation]);

  // Update volume dynamically without restarting speech mid-phrase
  useEffect(() => {
    globalSpeechEngine.setVolume(speechVolume);
  }, [speechVolume]);

  // Handle auto-rotation — only rotates when frequency playback is active
  useEffect(() => {
    if (!isPlaying || mode === 'off' || !autoRotate || !activeAffirmation || eligibleList.length <= 1) return;

    const interval = setInterval(() => {
      const next = AffirmationService.getNextAffirmation(activeAffirmation.id, query);
      if (next) {
        setActiveAffirmation(next);
        if (onActiveAffirmationChange) onActiveAffirmationChange(next);
      }
    }, rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [isPlaying, mode, autoRotate, rotationInterval, activeAffirmation, eligibleList]);

  const handleNext = useCallback(() => {
    if (!activeAffirmation) return;
    const next = AffirmationService.getNextAffirmation(activeAffirmation.id, query);
    if (next) {
      setActiveAffirmation(next);
      if (onActiveAffirmationChange) onActiveAffirmationChange(next);
    }
  }, [activeAffirmation, query, onActiveAffirmationChange]);

  const handlePrev = useCallback(() => {
    if (!activeAffirmation || eligibleList.length <= 1) return;
    const currentIndex = eligibleList.findIndex((item) => item.id === activeAffirmation.id);
    const prevIndex = currentIndex <= 0 ? eligibleList.length - 1 : currentIndex - 1;
    const prev = eligibleList[prevIndex];
    setActiveAffirmation(prev);
    if (onActiveAffirmationChange) onActiveAffirmationChange(prev);
  }, [activeAffirmation, eligibleList, onActiveAffirmationChange]);

  return (
    <GlassCard style={styles.card} intensity={60}>
      {/* Header & Mode Segmented Control */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Sparkles color={colors.primary} size={18} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Affirmation Stream
          </Text>
        </View>

        {mode !== 'off' && (
          <TouchableOpacity
            style={styles.disableButton}
            onPress={() => onModeChange('off')}
            accessibilityRole="button"
            accessibilityLabel="Turn off affirmations"
          >
            <XCircle color={colors.textMuted} size={16} />
            <Text style={[styles.disableText, { color: colors.textMuted }]}>Off</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mode Segmented Selector */}
      <View style={[styles.modeSegment, { backgroundColor: colors.glass }]}>
        {(['off', 'visual', 'spoken', 'both'] as AffirmationMode[]).map((m) => {
          const isSelected = mode === m;
          return (
            <TouchableOpacity
              key={m}
              style={[
                styles.modeOption,
                isSelected && { backgroundColor: colors.primary },
              ]}
              onPress={() => onModeChange(m)}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {m === 'off' ? 'Off' : m === 'visual' ? 'Visual' : m === 'spoken' ? 'Voice' : 'Both'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Content Area (Active when Mode !== 'off') */}
      {mode !== 'off' && (
        <View style={styles.activeContent}>
          {/* Intention Selector Bar */}
          <View style={styles.intentionHeader}>
            <Text style={[styles.intentionLabel, { color: colors.textMuted }]}>INTENTION</Text>
            <TouchableOpacity
              style={[styles.intentionSelector, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
              onPress={() => setShowCategoryPicker((prev) => !prev)}
            >
              <Text style={[styles.intentionText, { color: colors.primary }]}>
                {CATEGORY_LABELS[selectedIntention]?.label || selectedIntention}
              </Text>
              <Sliders color={colors.primary} size={14} />
            </TouchableOpacity>
          </View>

          {/* Intention Category Selector Grid / Scroll */}
          {showCategoryPicker && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {CATEGORIES.map((cat) => {
                const isCatSelected = selectedIntention === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isCatSelected ? colors.primary + '20' : colors.glass,
                        borderColor: isCatSelected ? colors.primary : colors.glassBorder,
                      },
                    ]}
                    onPress={() => {
                      setSelectedIntention(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isCatSelected ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {CATEGORY_LABELS[cat]?.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Active Affirmation Display / Empty State */}
          {activeAffirmation ? (
            <View style={[styles.affirmationDisplay, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <View style={styles.affirmationMetaRow}>
                <Text style={[styles.affirmationCategory, { color: colors.primary }]}>
                  {activeAffirmation.title || CATEGORY_LABELS[activeAffirmation.category]?.label}
                </Text>
                {activeAffirmation.tone && (
                  <Text style={[styles.toneBadge, { color: colors.textMuted }]}>
                    {activeAffirmation.tone}
                  </Text>
                )}
              </View>

              <Text style={[styles.affirmationText, { color: colors.textPrimary }]}>
                "{activeAffirmation.text}"
              </Text>

              {/* Navigation & Rotation Controls */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.navButton, { backgroundColor: colors.glass }]}
                  onPress={handlePrev}
                  disabled={eligibleList.length <= 1}
                >
                  <ChevronLeft color={eligibleList.length > 1 ? colors.textPrimary : colors.textMuted} size={18} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rotateButton,
                    {
                      backgroundColor: autoRotate ? colors.primary + '20' : colors.glass,
                      borderColor: autoRotate ? colors.primary : colors.glassBorder,
                    },
                  ]}
                  onPress={() => setAutoRotate((prev) => !prev)}
                >
                  <RefreshCw color={autoRotate ? colors.primary : colors.textMuted} size={14} />
                  <Text style={[styles.rotateText, { color: autoRotate ? colors.primary : colors.textMuted }]}>
                    {autoRotate ? `Rotate (${rotationInterval}s)` : 'Manual'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navButton, { backgroundColor: colors.glass }]}
                  onPress={handleNext}
                  disabled={eligibleList.length <= 1}
                >
                  <ChevronRight color={eligibleList.length > 1 ? colors.textPrimary : colors.textMuted} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.glass }]}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No affirmations found for this context
              </Text>
              <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                Choose another intention scope or continue listening to sound only.
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => setSelectedIntention('confidence')}
              >
                <Text style={styles.emptyButtonText}>Switch Intention</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Voice Volume Control (when mode === 'spoken' or 'both') */}
          {(mode === 'spoken' || mode === 'both') && (
            <View style={styles.speechVolumeSection}>
              <View style={styles.speechVolumeHeader}>
                <Text style={[styles.speechVolumeLabel, { color: colors.textMuted }]}>
                  VOICE VOLUME ({Math.round(speechVolume * 100)}%)
                </Text>
              </View>
              <View style={styles.speechVolumeBarRow}>
                <TouchableOpacity onPress={() => onSpeechVolumeChange(speechVolume > 0 ? 0 : 0.7)}>
                  {speechVolume === 0 ? (
                    <VolumeX color={colors.textMuted} size={18} />
                  ) : (
                    <Volume2 color={colors.primary} size={18} />
                  )}
                </TouchableOpacity>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.volumePills}
                >
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => {
                    const isActive = Math.abs(speechVolume - v) < 0.1;
                    return (
                      <TouchableOpacity
                        key={v}
                        style={[
                          styles.volumePill,
                          {
                            backgroundColor: isActive ? colors.primary : colors.glass,
                            borderColor: isActive ? colors.primary : colors.glassBorder,
                          },
                        ]}
                        onPress={() => onSpeechVolumeChange(v)}
                      >
                        <Text style={[styles.volumePillText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                          {Math.round(v * 100)}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    padding: 14,
    borderRadius: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  disableText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modeSegment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeContent: {
    marginTop: 4,
  },
  intentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  intentionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  intentionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  intentionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryScrollContent: {
    gap: 6,
    paddingHorizontal: 2,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  affirmationDisplay: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  affirmationMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  affirmationCategory: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toneBadge: {
    fontSize: 10,
    fontStyle: 'italic',
    textTransform: 'capitalize',
  },
  affirmationText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  rotateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  speechVolumeSection: {
    marginTop: 4,
  },
  speechVolumeHeader: {
    marginBottom: 6,
  },
  speechVolumeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  speechVolumeBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  volumePills: {
    flexDirection: 'row',
    gap: 6,
  },
  volumePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  volumePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
