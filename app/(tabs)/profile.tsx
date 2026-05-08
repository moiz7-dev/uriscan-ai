import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { format } from 'date-fns';
import { StreakBadge } from '@/components/StreakBadge';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useTrackerStore } from '@/store/useTrackerStore';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { describeReminderMode } from '@/lib/notifications';

const GOAL_STEP_ML = 250;
const GOAL_MIN_ML = 1000;
const GOAL_MAX_ML = 5000;

export default function ProfileScreen() {
  return (
    <ErrorBoundary>
      <Profile />
    </ErrorBoundary>
  );
}

function Profile() {
  const router = useRouter();
  const currentStreak = useHydrationStore((s) => s.currentStreak);
  const stats = useHydrationStore((s) => s.stats);
  const loadTodayData = useHydrationStore((s) => s.loadTodayData);

  const dailyGoalMl = useTrackerStore((s) => s.dailyGoalMl);
  const setDailyGoal = useTrackerStore((s) => s.setDailyGoal);
  const reminderMode = useTrackerStore((s) => s.reminderMode);

  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const isPro = usePurchaseStore((s) => s.isPro);
  const restore = usePurchaseStore((s) => s.restore);
  const restoreInFlight = usePurchaseStore((s) => s.restoreInFlight);

  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTodayData();
    }, [loadTodayData]),
  );

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const accountEmail = profile?.email ?? user?.email ?? null;
  const accountName = profile?.displayName ?? null;
  const restoring = restoreInFlight === 'pending';

  function handleSignOut() {
    Alert.alert(
      'Sign out?',
      'You can sign back in any time. Local scans stay on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            signOut().catch((e) => console.warn('signOut failed', e));
          },
        },
      ],
    );
  }

  async function handleRestore() {
    if (restoring) return;
    const result = await restore();
    if (!result.ok) {
      Alert.alert('Restore failed', result.message);
      return;
    }
    Alert.alert(
      result.owned ? 'Pro restored' : 'Nothing to restore',
      result.owned
        ? 'Your Pro entitlement is active on this device.'
        : 'No previous purchase was found for this Google account.',
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        <StreakBadge streak={currentStreak} />

        <View style={styles.statsRow}>
          <Stat label="Total scans" value={String(stats.totalScans)} />
          <Stat label="Avg score" value={String(stats.averageScore)} />
        </View>
        <View style={styles.bestDayCard}>
          <Text style={styles.cardLabel}>Best day</Text>
          {stats.bestDay ? (
            <Text style={styles.cardValue}>
              {format(new Date(stats.bestDay.date), 'MMM d, yyyy')}{' '}
              <Text style={styles.cardMuted}>· {stats.bestDay.score}</Text>
            </Text>
          ) : (
            <Text style={styles.cardMuted}>Log a scan to set a record</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily water goal</Text>
          <View style={styles.stepperRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease daily goal"
              onPress={() => setDailyGoal(Math.max(GOAL_MIN_ML, dailyGoalMl - GOAL_STEP_ML))}
              style={styles.stepperBtn}
            >
              <Ionicons name="remove" size={22} color={Colors.primary} />
            </Pressable>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperText}>{dailyGoalMl} ml</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase daily goal"
              onPress={() => setDailyGoal(Math.min(GOAL_MAX_ML, dailyGoalMl + GOAL_STEP_ML))}
              style={styles.stepperBtn}
            >
              <Ionicons name="add" size={22} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.card}
          onPress={() => router.push('/reminders')}
          accessibilityRole="button"
          accessibilityLabel="Edit reminders"
        >
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors.primary}
              />
              <View style={styles.rowText}>
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

        <Pressable
          onPress={() => setDisclaimerOpen((v) => !v)}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel="Toggle disclaimer details"
        >
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>Disclaimer</Text>
            </View>
            <Ionicons
              name={disclaimerOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textMuted}
            />
          </View>
          {disclaimerOpen && (
            <Text style={styles.disclaimerBody}>
              UriScan AI provides general wellness insights only. It is not a
              medical device, does not diagnose or treat any condition, and
              should not replace advice from a qualified healthcare professional.
              If you notice red, brown, or persistently dark urine, please
              consult a doctor.
            </Text>
          )}
        </Pressable>

        <DisclaimerBanner />

        <View style={styles.accountCard}>
          <Text style={styles.sectionLabel}>Account</Text>

          <View style={styles.accountHeader}>
            <View style={styles.accountAvatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              {accountName ? (
                <Text style={styles.accountName}>{accountName}</Text>
              ) : null}
              <Text style={styles.accountEmail}>{accountEmail ?? 'Signed in'}</Text>
              <View style={styles.proRow}>
                <View style={[styles.proPill, isPro ? styles.proPillActive : styles.proPillInactive]}>
                  <Ionicons
                    name={isPro ? 'star' : 'star-outline'}
                    size={10}
                    color={isPro ? Colors.success : Colors.textMuted}
                  />
                  <Text style={[styles.proPillText, isPro && styles.proPillTextActive]}>
                    {isPro ? 'Pro' : 'Free'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            style={({ pressed }) => [
              styles.accountAction,
              pressed && styles.actionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Restore previous purchase"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Restore purchase</Text>
            </View>
            {restoring ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            )}
          </Pressable>

          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.accountAction,
              pressed && styles.actionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="log-out-outline" size={20} color={Colors.text} />
              <Text style={styles.actionText}>Sign out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>

        </View>

        <Text style={styles.version}>UriScan AI · v{version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  title: { ...Typography.h1, color: Colors.text },

  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.card,
  },
  statValue: { ...Typography.h1, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textMuted },

  bestDayCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.xs,
    ...Shadows.card,
  },
  cardLabel: {
    ...Typography.micro,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  cardValue: { ...Typography.bodyBold, color: Colors.text },
  cardMuted: { ...Typography.caption, color: Colors.textMuted },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.card,
  },
  cardTitle: { ...Typography.h3, color: Colors.text },
  cardSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
  },
  stepperText: { ...Typography.h2, color: Colors.text },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  rowText: { flex: 1 },

  disclaimerBody: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 19,
    marginTop: Spacing.sm,
  },

  version: {
    ...Typography.micro,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },

  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  sectionLabel: {
    ...Typography.micro,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: { flex: 1, gap: 2 },
  accountName: { ...Typography.bodyBold, color: Colors.text },
  accountEmail: { ...Typography.caption, color: Colors.textMuted },
  proRow: { flexDirection: 'row', marginTop: 4 },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  proPillActive: { backgroundColor: '#ECFDF5' },
  proPillInactive: { backgroundColor: Colors.background },
  proPillText: { ...Typography.micro, color: Colors.textMuted, fontWeight: '700' },
  proPillTextActive: { color: Colors.success },
  accountAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  actionPressed: { opacity: 0.6 },
  actionText: { ...Typography.body, color: Colors.text },
});
