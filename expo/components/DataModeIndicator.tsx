import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Cloud, Smartphone, Wifi, ChevronDown, X } from 'lucide-react-native';
import { useDataMode, DataMode } from '@/hooks/useDataMode';
import { FONTS } from '@/constants/theme';

const MODE_CONFIG: Record<DataMode, {
  icon: typeof Cloud;
  color: string;
  bg: string;
  label: string;
  shortLabel: string;
}> = {
  auto: {
    icon: Wifi,
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.14)',
    label: 'Auto (Cloud → Local)',
    shortLabel: 'Auto',
  },
  cloud: {
    icon: Cloud,
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.14)',
    label: 'Cloud Only',
    shortLabel: 'Cloud',
  },
  local: {
    icon: Smartphone,
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.14)',
    label: 'Local Only',
    shortLabel: 'Local',
  },
};

interface Props {
  /** If true, renders as a compact floating badge. If false, renders inline for settings. */
  compact?: boolean;
  /** If true, shows the full dropdown picker inline (for settings page) */
  showPicker?: boolean;
}

export function DataModeIndicator({ compact = true, showPicker = false }: Props) {
  const { mode, modeLabel, setMode, lastCloudError, setCloudError } = useDataMode();
  const [expanded, setExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  useEffect(() => {
    if (lastCloudError) {
      // Flash animation on error
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
      // Auto-dismiss after 6s
      const timer = setTimeout(() => setCloudError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [lastCloudError]);

  useEffect(() => {
    // Layout properties (height/maxHeight) are not supported by the native
    // animated driver, so this animation runs on the JS thread. The dropdown
    // is small (max 140px), so the impact is negligible.
    Animated.timing(slideAnim, {
      toValue: expanded ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const handleModeChange = async (newMode: DataMode) => {
    await setMode(newMode);
    setExpanded(false);
  };

  const pickerHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
    extrapolate: 'clamp',
  });

  const pickerOpacity = slideAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  if (showPicker) {
    // Full settings-style picker
    return (
      <View style={styles.settingsContainer}>
        {lastCloudError && (
          <View style={styles.errorBanner}>
            <TouchableOpacity
              style={styles.errorClose}
              onPress={() => setCloudError(null)}
            >
              <X size={14} color="#FCA5A5" />
            </TouchableOpacity>
            <Text style={styles.errorText}>{lastCloudError}</Text>
          </View>
        )}
        <View style={styles.pickerRow}>
          {(Object.keys(MODE_CONFIG) as DataMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            const CfgIcon = cfg.icon;
            const isActive = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.pickerOption,
                  isActive && { backgroundColor: cfg.bg, borderColor: cfg.color },
                ]}
                onPress={() => handleModeChange(m)}
                activeOpacity={0.7}
              >
                <CfgIcon size={18} color={isActive ? cfg.color : 'rgba(240,239,255,0.35)'} />
                <Text style={[
                  styles.pickerLabel,
                  isActive && { color: cfg.color },
                ]}>
                  {cfg.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.pickerHint}>{modeLabel}</Text>
      </View>
    );
  }

  // Compact floating badge (default)
  const content = (
    <Animated.View style={[styles.badge, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.badgeButton}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconDot, { backgroundColor: config.color }]}>
          <Icon size={11} color="#0A0B1A" strokeWidth={2.5} />
        </View>
        <Text style={[styles.badgeLabel, { color: config.color }]}>
          {config.shortLabel}
        </Text>
        <ChevronDown
          size={10}
          color={config.color}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      <Animated.View style={[styles.dropdown, {
        height: pickerHeight,
        opacity: pickerOpacity,
      }]}>
        {(Object.keys(MODE_CONFIG) as DataMode[]).map((m) => {
          const cfg = MODE_CONFIG[m];
          const DdIcon = cfg.icon;
          const isActive = mode === m;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.dropdownItem, isActive && { backgroundColor: cfg.bg }]}
              onPress={() => handleModeChange(m)}
              activeOpacity={0.7}
            >
              <DdIcon size={14} color={isActive ? cfg.color : 'rgba(240,239,255,0.4)'} />
              <Text style={[styles.dropdownLabel, isActive && { color: cfg.color }]}>
                {cfg.label}
              </Text>
              {isActive && <View style={[styles.activeCheck, { backgroundColor: cfg.color }]} />}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </Animated.View>
  );

  if (Platform.OS === 'ios' && compact) {
    return (
      <BlurView intensity={32} tint="dark" style={styles.blurWrap}>
        {content}
      </BlurView>
    );
  }

  return (
    <View style={styles.nonBlurWrap}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  blurWrap: {
    position: 'absolute',
    top: 54,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 100,
  },
  nonBlurWrap: {
    position: 'absolute',
    top: 54,
    right: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 17, 32, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.18)',
    zIndex: 100,
    overflow: 'hidden',
  },
  badge: {
    minWidth: 82,
  },
  badgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dropdown: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dropdownLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(240,239,255,0.55)',
    flex: 1,
  },
  activeCheck: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Settings-style picker styles
  settingsContainer: {
    gap: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorClose: {
    padding: 2,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#FCA5A5',
    lineHeight: 17,
    fontWeight: '500',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pickerLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(240,239,255,0.35)',
    letterSpacing: 0.5,
  },
  pickerHint: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(240,239,255,0.3)',
    textAlign: 'center',
    fontWeight: '500',
  },
});
