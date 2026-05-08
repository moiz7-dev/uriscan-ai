import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ColorPicker } from '@/components/ColorPicker';
import { HydrationMeter } from '@/components/HydrationMeter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { COLOR_SWATCHES, getLevelColor } from '@/constants/hydrationData';
import { analyzeHydration } from '@/lib/hydrationEngine';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useTrackerStore } from '@/store/useTrackerStore';
import type { HydrationColor } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, stay hydrated!';
  if (h < 18) return 'Good afternoon, keep sipping!';
  return 'Good evening, finish strong!';
}

export default function HomeScreen() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}

function Home() {
  const router = useRouter();
  const todayScore = useHydrationStore((s) => s.todayScore);
  const todayScans = useHydrationStore((s) => s.todayScans);
  const recentScans = useHydrationStore((s) => s.recentScans);
  const loadTodayData = useHydrationStore((s) => s.loadTodayData);

  const addScan = useHydrationStore((s) => s.addScan);

  const dailyGoalMl = useTrackerStore((s) => s.dailyGoalMl);
  const todayIntakeMl = useTrackerStore((s) => s.todayIntakeMl);
  const loadTodayIntake = useTrackerStore((s) => s.loadTodayIntake);

  const [showPicker, setShowPicker] = useState(false);
  const [selected, setSelected] = useState<HydrationColor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTodayData();
      loadTodayIntake();
    }, [loadTodayData, loadTodayIntake]),
  );

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const meterColor = useMemo(() => {
    const latest = todayScans[0];
    return latest ? getLevelColor(latest.level) : Colors.primary;
  }, [todayScans]);

  const intakePct = Math.min(
    100,
    Math.round((todayIntakeMl / dailyGoalMl) * 100),
  );

  async function handleAnalyze() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const color = selected;
      const result = analyzeHydration(color);
      const { scanId, reportId } = await addScan(result);
      setShowPicker(false);
      setSelected(null);
      router.push({
        pathname: '/result',
        params: { color, reportId, scanId: String(scanId) },
      });
    } catch (e) {
      console.warn('handleAnalyze failed', e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.brand}>UriScan AI</Text>
          <Text style={styles.greeting}>{greeting()} 💧</Text>
        </View>

        <View style={styles.scoreCard}>
          <HydrationMeter score={todayScore} color={meterColor} />
          <Text style={styles.scoreCaption}>
            {todayScore === 0
              ? 'No scan yet today'
              : format(new Date(), 'EEEE, MMM d')}
          </Text>
        </View>

        {!showPicker ? (
          <View style={styles.ctaRow}>
            <AnimatedPressable
              style={[styles.cta, styles.ctaPrimary, pulseStyle]}
              onPress={() => setShowPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Quick scan"
            >
              <Ionicons name="color-palette" size={24} color="#fff" />
              <Text style={styles.ctaText}>Quick Scan</Text>
            </AnimatedPressable>
            <Pressable
              style={[styles.cta, styles.ctaSecondary]}
              onPress={() => router.push('/scan')}
              accessibilityRole="button"
              accessibilityLabel="Camera scan"
            >
              <Ionicons name="camera" size={24} color={Colors.primary} />
              <Text style={[styles.ctaText, styles.ctaTextSecondary]}>Camera</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Pick the closest match</Text>
            <Text style={styles.pickerSub}>Compare against natural daylight</Text>
            <View style={styles.pickerSpacer} />
            <ColorPicker selected={selected} onSelect={setSelected} />
            <View style={styles.pickerActions}>
              <Pressable
                onPress={() => {
                  setShowPicker(false);
                  setSelected(null);
                }}
                style={styles.ghostButton}
                accessibilityRole="button"
                accessibilityLabel="Cancel scan"
              >
                <Text style={styles.ghostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAnalyze}
                disabled={!selected || submitting}
                style={[
                  styles.primaryButton,
                  (!selected || submitting) && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Analyze"
              >
                <Text style={styles.primaryText}>
                  {submitting ? 'Analyzing…' : 'Analyze'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.miniCard}>
          <View style={styles.miniHeader}>
            <Ionicons name="water" size={20} color={Colors.primary} />
            <Text style={styles.miniTitle}>Today&apos;s water</Text>
          </View>
          <Text style={styles.miniValue}>
            {todayIntakeMl} <Text style={styles.miniUnit}>ml</Text>
            <Text style={styles.miniMuted}> / {dailyGoalMl} ml</Text>
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${intakePct}%` }]} />
          </View>
        </View>

        <View style={styles.miniCard}>
          <View style={styles.miniHeader}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.miniTitle}>Recent scans</Text>
          </View>
          {recentScans.length === 0 ? (
            <Text style={styles.emptyText}>Your last 3 scans will appear here.</Text>
          ) : (
            <View style={styles.dotRow}>
              {recentScans.map((s) => {
                const swatch = COLOR_SWATCHES.find((c) => c.id === s.color);
                return (
                  <View key={s.id} style={styles.dotItem}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: swatch?.hex ?? Colors.border },
                      ]}
                    />
                    <Text style={styles.dotLabel}>
                      {format(new Date(s.timestamp), 'MMM d')}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  header: { gap: Spacing.xs },
  brand: { ...Typography.h1, color: Colors.text },
  greeting: { ...Typography.body, color: Colors.textMuted },

  scoreCard: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  scoreCaption: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },

  ctaRow: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  cta: {
    borderRadius: Radii.pill,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 56,
  },
  ctaPrimary: {
    backgroundColor: Colors.primary,
    ...Shadows.raised,
  },
  ctaSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    ...Shadows.card,
  },
  ctaText: { ...Typography.h3, color: '#fff' },
  ctaTextSecondary: { color: Colors.primary },

  pickerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  pickerTitle: { ...Typography.h3, color: Colors.text },
  pickerSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  pickerSpacer: { height: Spacing.base },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  ghostButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  ghostText: { ...Typography.bodyBold, color: Colors.textMuted },
  primaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    minHeight: 44,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { ...Typography.bodyBold, color: '#fff' },
  disabled: { opacity: 0.4 },

  miniCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    ...Shadows.card,
    gap: Spacing.sm,
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  miniTitle: { ...Typography.bodyBold, color: Colors.text },
  miniValue: { ...Typography.h2, color: Colors.text },
  miniUnit: { ...Typography.caption, color: Colors.textMuted },
  miniMuted: { ...Typography.caption, color: Colors.textMuted },

  progressTrack: {
    height: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },

  emptyText: { ...Typography.caption, color: Colors.textMuted },

  dotRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  dotItem: { alignItems: 'center', gap: Spacing.xs },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotLabel: { ...Typography.micro, color: Colors.textMuted },
});
