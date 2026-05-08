import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { COLOR_SWATCHES, getLevelColor } from '@/constants/hydrationData';
import { analyzeHydration } from '@/lib/hydrationEngine';
import { LEVEL_TOTAL, getLevelIndex, getTeaserHook } from '@/lib/teaserCopy';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ReportTeaser } from '@/components/report/ReportTeaser';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import type { HydrationColor } from '@/types';

const VALID_COLORS: HydrationColor[] = [
  'clear',
  'light-yellow',
  'yellow',
  'dark-yellow',
  'amber',
  'orange',
  'brown',
  'red',
];

function isValidColor(value: string): value is HydrationColor {
  return (VALID_COLORS as string[]).includes(value);
}

export default function ResultScreen() {
  return (
    <ErrorBoundary>
      <Result />
    </ErrorBoundary>
  );
}

function Result() {
  const router = useRouter();
  const params = useLocalSearchParams<{ color?: string; reportId?: string; scanId?: string }>();
  const isPro = usePurchaseStore((s) => s.isPro);

  const result = useMemo(() => {
    const c = params.color;
    if (!c || !isValidColor(c)) return null;
    return analyzeHydration(c);
  }, [params.color]);

  useEffect(() => {
    if (!result || !params.reportId) {
      router.back();
    }
  }, [result, params.reportId, router]);

  if (!result || !params.reportId) {
    return <View style={styles.safe} />;
  }

  const reportId = params.reportId;
  const swatch = COLOR_SWATCHES.find((c) => c.id === result.color);
  const levelColor = getLevelColor(result.level);
  const hook = getTeaserHook(result.level, reportId);
  const levelIndex = getLevelIndex(result.level);
  const isWarning = result.level === 'warning';

  function openReport() {
    router.push({ pathname: '/report/[reportId]', params: { reportId } });
  }

  function scanAgain() {
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View
        entering={SlideInDown.springify().damping(16)}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.handle} />

          <View
            style={[styles.swatch, { backgroundColor: result.colorHex }]}
            accessibilityLabel={`Selected color ${result.color}`}
          />

          <Animated.View entering={FadeIn.delay(120)} style={styles.content}>
            <View style={styles.chipRow}>
              <View style={[styles.levelChip, { backgroundColor: levelColor + '22' }]}>
                <Text style={[styles.levelChipText, { color: levelColor }]}>
                  Level {levelIndex} of {LEVEL_TOTAL}
                </Text>
              </View>
              <Text style={styles.colorName}>{swatch?.label ?? result.color}</Text>
            </View>

            <Text style={styles.hook}>{hook}</Text>

            {isWarning && (
              <View style={styles.safetyCard}>
                <Ionicons name="medical" size={18} color={Colors.danger} />
                <Text style={styles.safetyText}>
                  This color range can indicate a medical concern. Please consult a
                  healthcare professional. The full report includes a clinician checklist.
                </Text>
              </View>
            )}

            {!isPro && <ReportTeaser />}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.actions}>
            <Pressable
              onPress={scanAgain}
              style={styles.ghostButton}
              accessibilityRole="button"
              accessibilityLabel="Scan again"
            >
              <Text style={styles.ghostText}>Scan Again</Text>
            </Pressable>
            <Pressable
              onPress={openReport}
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel={isPro ? 'View detailed report' : 'View paywall to unlock report'}
            >
              <Ionicons name={isPro ? 'document-text' : 'lock-open'} size={18} color="#fff" />
              <Text style={styles.primaryText}>
                {isPro ? 'View Detailed Report' : 'Unlock Detailed Report'}
              </Text>
            </Pressable>
          </View>
          <DisclaimerBanner variant="inline" />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xl },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  swatch: {
    width: 96,
    height: 96,
    borderRadius: Radii.xl,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  content: { gap: Spacing.base },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  levelChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  levelChipText: { ...Typography.micro, fontWeight: '700', textTransform: 'uppercase' },
  colorName: { ...Typography.bodyBold, color: Colors.textMuted },
  hook: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    lineHeight: 30,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: Radii.md,
    backgroundColor: '#FEE2E2',
  },
  safetyText: {
    ...Typography.body,
    color: Colors.danger,
    flex: 1,
    lineHeight: 21,
  },
  footer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    gap: Spacing.sm,
  },
  actions: { flexDirection: 'row', gap: Spacing.md },
  ghostButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 52,
  },
  ghostText: { ...Typography.bodyBold, color: Colors.text },
  primaryButton: {
    flex: 1.4,
    paddingVertical: Spacing.base,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    minHeight: 52,
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.raised,
  },
  primaryText: { ...Typography.bodyBold, color: '#fff' },
});
