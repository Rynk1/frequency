import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Square, Plus, Minus } from 'lucide-react-native';

interface SessionTimerProps {
  frequency: any;
  onComplete: () => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  frequency,
  onComplete,
}) => {
  const [duration, setDuration] = useState<number>(20); // minutes
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60); // seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Refs so the interval is set up ONCE and reads latest state without re-subscribing.
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsCompleted(true);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (isCompleted) {
      setTimeLeft(duration * 60);
      setIsCompleted(false);
    }
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setIsCompleted(false);
  };

  const adjustDuration = (change: number) => {
    if (!isRunning) {
      const newDuration = Math.max(1, Math.min(120, duration + change));
      setDuration(newDuration);
      setTimeLeft(newDuration * 60);
    }
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <LinearGradient
      colors={frequency.gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <Text style={styles.frequencyName}>{frequency.name}</Text>
        <Text style={styles.frequencyHz}>{frequency.hz} Hz</Text>
        
        <View style={styles.timerDisplay}>
          <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress}%` }
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.durationControls}>
          <TouchableOpacity
            style={[styles.durationButton, isRunning && styles.disabledButton]}
            onPress={() => adjustDuration(-5)}
            disabled={isRunning}
          >
            <Minus color="#FFFFFF" size={16} />
          </TouchableOpacity>
          
          <Text style={styles.durationText}>{duration} min</Text>
          
          <TouchableOpacity
            style={[styles.durationButton, isRunning && styles.disabledButton]}
            onPress={() => adjustDuration(5)}
            disabled={isRunning}
          >
            <Plus color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleStart}
          >
            {isRunning ? (
              <Pause color="#FFFFFF" size={24} />
            ) : (
              <Play color="#FFFFFF" size={24} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleStop}
          >
            <Square color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {isCompleted && (
          <Text style={styles.completedText}>Session Complete! 🎉</Text>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  frequencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  frequencyHz: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 20,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  progressContainer: {
    width: 200,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  durationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 60,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 15,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 15,
    textAlign: 'center',
  },
});