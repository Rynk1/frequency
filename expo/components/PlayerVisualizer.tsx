import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import {
  wavePoints,
  smoothPath,
  equalizerBars,
  cyclesForFrequency,
  amplitudeForHeight,
} from '@/lib/visualizers/wave';
import { breathScale } from '@/lib/motion';
import {
  VISUALIZER_LABELS,
  nextVisualizerStyle,
  type VisualizerStyle,
} from '@/lib/visualizers/styles';

export type { VisualizerStyle };
export { VISUALIZER_LABELS, nextVisualizerStyle };

interface Props {
  style?: VisualizerStyle;
  /** Tone in Hz — drives crest density and the ring count. */
  hz: number;
  isPlaying: boolean;
  /** Stage size; the parent measures it so the SVG is always exact. */
  width: number;
  height: number;
  color: string;
  accent: string;
  /** When true, render a still frame. Respects the OS reduce-motion setting. */
  reducedMotion?: boolean;
}

/**
 * The player's visual centrepiece.
 *
 * Three styles, deliberately different in character rather than three
 * variations of the same bars:
 *
 * - `wave`      layered sine waves. Reads as breath and sound pressure.
 * - `equalizer` a mirrored spectrum. Reads as "this is audio".
 * - `orb`       concentric rings. Reads as a singing bowl / chakra centre.
 *
 * All three share the same breath cadence (see lib/motion) so switching style
 * never changes the pace the user is breathing to.
 */
export const PlayerVisualizer: React.FC<Props> = ({
  style = 'wave',
  hz,
  isPlaying,
  width,
  height,
  color,
  accent,
  reducedMotion = false,
}) => {
  const clock = useRef(new Animated.Value(0)).current;
  const [tick, setTick] = React.useState(0);

  // A single driver value keeps every layer in phase. We sample it on the JS
  // thread at a low rate rather than animating dozens of nodes individually —
  // far cheaper, and these shapes are smooth enough that 12 fps reads fine.
  useEffect(() => {
    if (!isPlaying || reducedMotion) {
      clock.stopAnimation();
      clock.setValue(0);
      setTick(0);
      return;
    }
    clock.setValue(0);
    const loop = Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    const id = clock.addListener(({ value }) => setTick(value));
    loop.start();
    return () => {
      loop.stop();
      clock.removeListener(id);
    };
  }, [isPlaying, reducedMotion, clock, style]);

  // Elapsed seconds across a 20 s driver loop.
  const t = tick * 20;

  const shapes = useMemo(() => {
    if (style === 'equalizer') {
      const count = width < 360 ? 22 : width < 600 ? 30 : 40;
      return equalizerBars(count, reducedMotion ? 0 : t * 2.1, 1).map((v) => v);
    }
    return [];
  }, [style, width, t, reducedMotion]);

  const cycles = cyclesForFrequency(hz);
  const amplitude = amplitudeForHeight(height);

  if (style === 'equalizer') {
    const barWidth = width / (shapes.length * 1.8);
    return (
      <View style={[styles.stage, { width, height }]} pointerEvents="none">
        <Svg width={width} height={height}>
          <Defs>
            <SvgGradient id="eq" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity="0.95" />
              <Stop offset="1" stopColor={color} stopOpacity="0.35" />
            </SvgGradient>
          </Defs>
          {shapes.map((v, i) => {
            // Mirror about the vertical centre so the bars read as a spectrum,
            // not a bar chart.
            const barHeight = Math.max(4, v * height * 0.42);
            const x = i * barWidth * 1.8 + barWidth * 0.4;
            const y = height / 2 - barHeight / 2;
            return (
              <Path
                key={i}
                d={roundedBar(x, y, barWidth, barHeight, barWidth / 2)}
                fill="url(#eq)"
                opacity={0.55 + v * 0.45}
              />
            );
          })}
        </Svg>
      </View>
    );
  }

  if (style === 'orb') {
    const pulse = breathScale(reducedMotion ? 0 : t);
    const rings = [0.28, 0.42, 0.56, 0.7];
    return (
      <View style={[styles.stage, { width, height }]} pointerEvents="none">
        <Svg width={width} height={height}>
          <Defs>
            <SvgGradient id="orb" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity="0.9" />
              <Stop offset="1" stopColor={color} stopOpacity="0.5" />
            </SvgGradient>
          </Defs>
          {rings.map((r, i) => {
            // Rings expand in sequence, each slightly offset in the breath
            // cycle, so the orb looks like it is radiating rather than
            // throbbing as one lump.
            const offset = (reducedMotion ? 0 : t / 2.5 + i * 0.35) % 1;
            const radius = r * Math.min(width, height) * 0.5 * (0.85 + offset * 0.3) * pulse;
            return (
              <Circle
                key={i}
                cx={width / 2}
                cy={height / 2}
                r={Math.max(6, radius)}
                stroke="url(#orb)"
                strokeWidth={i === 0 ? 2.5 : 1.25}
                fill="none"
                opacity={0.75 - offset * 0.55}
              />
            );
          })}
          <Circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.06} fill={accent} opacity={0.85} />
        </Svg>
      </View>
    );
  }

  // wave: three layers at different speeds/opacities for depth.
  const layers = [
    { cycles, amp: amplitude, speed: 1, opacity: 0.9, width: 2 },
    { cycles: cycles + 2, amp: amplitude * 0.62, speed: -0.7, opacity: 0.45, width: 1.5 },
    { cycles: Math.max(2, cycles - 1), amp: amplitude * 0.38, speed: 0.45, opacity: 0.25, width: 1 },
  ];

  return (
    <View style={[styles.stage, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="wave" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.15" />
            <Stop offset="0.5" stopColor={accent} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0.15" />
          </SvgGradient>
        </Defs>
        {layers.map((layer, i) => {
          const phase = reducedMotion ? i : t * layer.speed;
          const points = wavePoints({
            width,
            height,
            cycles: layer.cycles,
            amplitude: layer.amp,
            phase,
            samples: width < 360 ? 40 : 72,
          });
          return (
            <Path
              key={i}
              d={smoothPath(points)}
              stroke="url(#wave)"
              strokeWidth={layer.width}
              fill="none"
              opacity={layer.opacity}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
};

/** SVG path for a bar with rounded caps — cheaper than nesting Rect + ClipPath. */
function roundedBar(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h / 2);
  return [
    `M ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h - radius}`,
    `Q ${x + w} ${y + h} ${x + w - radius} ${y + h}`,
    `L ${x + radius} ${y + h}`,
    `Q ${x} ${y + h} ${x} ${y + h - radius}`,
    'Z',
  ].join(' ');
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
});
