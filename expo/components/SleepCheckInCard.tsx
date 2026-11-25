import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Moon } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { PremiumModal } from './PremiumModal';
import { clearSleepCheckIn, readPendingSleepCheckIn } from '@/lib/notifications/sleep-checkin';
import { track } from '@/lib/telemetry';

export const SleepCheckInCard: React.FC = () => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    readPendingSleepCheckIn().then((pending) => {
      if (!pending) return;
      setVisible(true);
      track('sleep_checkin_prompted', {});
    });
  }, []);

  const answer = async (positive: boolean) => {
    await clearSleepCheckIn();
    setVisible(false);
    if (positive) {
      track('sleep_checkin_positive', {});
      setShowPaywall(true);
    } else {
      track('sleep_checkin_negative', {});
    }
  };

  if (!visible) return null;

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        <View style={styles.row}>
          <Moon color={colors.gold} size={18} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>How was last night?</Text>
        </View>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          One tap helps you shape tonight’s wind-down. There is no wrong answer.
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.answer, { borderColor: colors.glassBorder }]}
            onPress={() => answer(false)}
            activeOpacity={0.85}
          >
            <Text style={[styles.answerText, { color: colors.textSecondary }]}>Not great</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.answer, { borderColor: colors.gold }]}
            onPress={() => answer(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.answerText, { color: colors.gold }]}>Better</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PremiumModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onStartTrial={() => setShowPaywall(false)}
        onUpgrade={() => setShowPaywall(false)}
        trigger="sleep_checkin_positive"
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  answer: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: { fontSize: 13, fontWeight: '600' },
});
