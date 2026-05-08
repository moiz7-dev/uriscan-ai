import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TrendChart } from '@/components/TrendChart';
import { COLOR_SWATCHES, getLevelColor } from '@/constants/hydrationData';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { getAllScans, getScansForWeek } from '@/lib/database';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import type { Scan } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  return (
    <ErrorBoundary>
      <History />
    </ErrorBoundary>
  );
}

function History() {
  const router = useRouter();
  const isPro = usePurchaseStore((s) => s.isPro);
  const [allScans, setAllScans] = useState<Scan[]>([]);
  const [weekScans, setWeekScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [all, week] = await Promise.all([getAllScans(), getScansForWeek()]);
      setAllScans(all);
      setWeekScans(week);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={allScans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.title}>History</Text>
            <TrendChart scans={weekScans} />
          </View>
        }
        renderItem={({ item, index }) => {
          const date = new Date(item.timestamp);
          const dateStr = format(date, 'EEE, MMM d');
          const previous = allScans[index - 1];
          const showHeader =
            !previous ||
            format(new Date(previous.timestamp), 'yyyy-MM-dd') !==
            format(date, 'yyyy-MM-dd');
          const swatch = COLOR_SWATCHES.find((c) => c.id === item.color);
          return (
            <View>
              {showHeader && <Text style={styles.dateHeader}>{dateStr}</Text>}
              <Pressable
                onPress={() =>
                  item.reportId &&
                  router.push({
                    pathname: '/report/[reportId]',
                    params: { reportId: item.reportId },
                  })
                }
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={
                  isPro ? 'Open detailed report' : 'Open paywall to unlock reports'
                }
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: swatch?.hex ?? Colors.border },
                  ]}
                />
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {swatch?.label ?? item.color}
                  </Text>
                  <Text style={styles.rowSub}>
                    {format(date, 'h:mm a')} · {item.level}
                  </Text>
                </View>
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: getLevelColor(item.level) + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreText,
                      { color: getLevelColor(item.level) },
                    ]}
                  >
                    {item.score}
                  </Text>
                </View>
                {isPro ? (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                ) : (
                  <Ionicons name="lock-closed" size={16} color="#F5C518" />
                )}
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Text style={styles.emptyText}>
                Tap Quick Scan on the home tab to log your first reading.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  headerWrap: { gap: Spacing.lg, marginBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.text },

  dateHeader: {
    ...Typography.micro,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    ...Shadows.card,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { ...Typography.bodyBold, color: Colors.text },
  rowSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  rowPressed: { opacity: 0.65 },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    minWidth: 40,
    alignItems: 'center',
    flexShrink: 0,
  },
  scoreText: { ...Typography.bodyBold, fontSize: 15 },

  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyTitle: { ...Typography.h2, color: Colors.text, marginTop: Spacing.md },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
