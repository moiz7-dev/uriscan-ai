import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WaterGlassTracker } from '@/components/WaterGlassTracker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTrackerStore } from '@/store/useTrackerStore';
import { describeReminderMode } from '@/lib/notifications';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function TrackerScreen() {
  return (
    <ErrorBoundary>
      <Tracker />
    </ErrorBoundary>
  );
}

function Tracker() {
  const router = useRouter();
  const dailyGoalMl = useTrackerStore((s) => s.dailyGoalMl);
  const todayIntakeMl = useTrackerStore((s) => s.todayIntakeMl);
  const glasses = useTrackerStore((s) => s.glasses);
  const reminderMode = useTrackerStore((s) => s.reminderMode);
  const addWater = useTrackerStore((s) => s.addWater);
  const toggleGlass = useTrackerStore((s) => s.toggleGlass);
  const loadTodayIntake = useTrackerStore((s) => s.loadTodayIntake);

  useFocusEffect(
    useCallback(() => {
      loadTodayIntake();
    }, [loadTodayIntake]),
  );

  const intakePct = Math.min(100, Math.round((todayIntakeMl / dailyGoalMl) * 100));
  const remainingMl = Math.max(0, dailyGoalMl - todayIntakeMl);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Water Tracker</Text>
          <Text style={styles.subtitle}>
            {remainingMl === 0
              ? "You've reached your goal — nice work!"
              : `${remainingMl} ml to go to hit your goal`}
          </Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalTop}>
            <View>
              <Text style={styles.goalLabel}>Today</Text>
              <Text style={styles.goalValue}>
                {todayIntakeMl}
                <Text style={styles.goalUnit}> / {dailyGoalMl} ml</Text>
              </Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{intakePct}%</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${intakePct}%` }]} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Glasses</Text>
          <Text style={styles.cardSub}>
            Tap a glass to fill up to it. Tap a filled glass to roll back to the one before.
          </Text>
          <View style={styles.spacer} />
          <WaterGlassTracker glasses={glasses} onToggle={toggleGlass} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick add</Text>
          <View style={styles.quickRow}>
            <QuickButton label="+250 ml" onPress={() => addWater(250)} />
            <QuickButton label="+500 ml" onPress={() => addWater(500)} />
            <QuickButton label="+1 L" onPress={() => addWater(1000)} primary />
          </View>
        </View>

        <Pressable
          style={styles.card}
          onPress={() => router.push('/reminders')}
          accessibilityRole="button"
          accessibilityLabel="Edit reminders"
        >
          <View style={styles.reminderRow}>
            <View style={styles.reminderLeft}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors.primary}
              />
              <View style={styles.reminderText}>
                <Text style={styles.cardTitle}>Reminders</Text>
                <Text style={styles.cardSub}>
                  {describeReminderMode(reminderMode)}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textMuted}
            />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface QuickButtonProps {
  label: string;
  onPress: () => void;
  primary?: boolean;
}

function QuickButton({ label, onPress, primary }: QuickButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickButton, primary && styles.quickButtonPrimary]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.quickButtonText, primary && styles.quickButtonTextPrimary]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  header: { gap: Spacing.xs },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textMuted },

  goalCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalLabel: { ...Typography.micro, color: Colors.textMuted, textTransform: 'uppercase' },
  goalValue: { ...Typography.h1, color: Colors.text },
  goalUnit: { ...Typography.body, color: Colors.textMuted },
  percentBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  percentText: { ...Typography.bodyBold, color: Colors.primary },
  progressTrack: {
    height: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    ...Shadows.card,
  },
  cardTitle: { ...Typography.h3, color: Colors.text },
  cardSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  spacer: { height: Spacing.base },

  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  quickButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickButtonText: { ...Typography.bodyBold, color: Colors.text },
  quickButtonTextPrimary: { color: '#fff' },

  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  reminderText: { flex: 1 },
});
