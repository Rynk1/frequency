import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, LayoutAnimation, Platform } from 'react-native';

interface FrequencyVisualizerProps {
  frequency: number | null;
  isPlaying: boolean;
  color?: string;
}

const BAR_COUNT = 28;
// Pre-computed deterministic bar phases so we don't call Math.random in render.
const BAR_PHASES = Array.from({ length: BAR_COUNT }, (_, i) => (i / BAR_COUNT) * Math.PI * 2);

export const FrequencyVisualizer: React.FC<FrequencyVisualizerProps> = ({
  frequency,
  isPlaying,
  color = '#A78BFA',
}) => {
  // Use scaleY transform (animatable on native driver) instead of height.
  // Each bar is given a fixed base height; the animated value drives a 0..1 scale.
  const scalesRef = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.08))
  );
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0.4)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const rippleLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startAnimation = useCallback(() => {
    // Stop any existing loops first to prevent leaks.
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    if (rippleLoopRef.current) {
      rippleLoopRef.current.stop();
      rippleLoopRef.current = null;
    }

    // 28 independent loops — all on the NATIVE driver via scaleY.
    const animations = scalesRef.current.map((anim, index) => {
      const baseOffset = Math.sin(BAR_PHASES[index]) * 0.3;
      const peak = 0.55 + baseOffset + ((index * 37) % 100) / 200; // deterministic pseudo-random
      const duration = 600 + ((index * 53) % 500);
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: Math.min(1, peak), duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.06 + ((index * 29) % 20) / 100, duration, useNativeDriver: true }),
        ]),
        { iterations: -1 }
      );
    });

    animationRef.current = Animated.stagger(40, animations);
    animationRef.current.start();

    // Ripple pulse — also native-driven (scale + opacity only).
    rippleLoopRef.current = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rippleAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
          Animated.timing(rippleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(rippleOpacity, { toValue: 0, duration: 2200, useNativeDriver: true }),
          Animated.timing(rippleOpacity, { toValue: 0.45, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    rippleLoopRef.current.start();
  }, [rippleAnim, rippleOpacity]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    if (rippleLoopRef.current) {
      rippleLoopRef.current.stop();
      rippleLoopRef.current = null;
    }
    // Reset bars to idle — batch as a single parallel animation.
    Animated.parallel(
      scalesRef.current.map((anim) =>
        Animated.timing(anim, { toValue: 0.08, duration: 400, useNativeDriver: true })
      )
    ).start();
    Animated.timing(rippleOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  }, [rippleOpacity]);

  useEffect(() => {
    if (isPlaying && frequency) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      if (rippleLoopRef.current) {
        rippleLoopRef.current.stop();
        rippleLoopRef.current = null;
      }
    };
  }, [isPlaying, frequency, startAnimation, stopAnimation]);

  const rippleScale = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] });
  const ripple2Scale = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] });
  const ripple2Opacity = rippleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 0.15, 0] });

  // Render bars once; transforms are driven by animated values off the JS thread.
  const bars = scalesRef.current;

  return (
    <View style={styles.container}>
      {isPlaying && (
        <View style={styles.rippleContainer} pointerEvents="none">
          <Animated.View
            style={[styles.ripple, { borderColor: color, transform: [{ scale: rippleScale }], opacity: rippleOpacity }]}
          />
          <Animated.View
            style={[styles.ripple, { borderColor: color, transform: [{ scale: ripple2Scale }], opacity: ripple2Opacity }]}
          />
        </View>
      )}

      <View style={styles.barsRow} pointerEvents="none">
        {bars.map((anim, index) => (
          <View key={index} style={styles.barColumn}>
            <Animated.View
              style={[
                styles.bar,
                { backgroundColor: color, opacity: 0.9, transform: [{ scaleY: anim }] },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 100, gap: 2 },
  barColumn: { alignItems: 'center', justifyContent: 'flex-end', height: 100 },
  bar: {
    width: 3.5,
    height: 90,
    borderRadius: 2,
    marginBottom: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  rippleContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1.5 },
});
