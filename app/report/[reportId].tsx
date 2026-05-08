import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { Paywall } from '@/components/report/Paywall';
import { DetailedReport } from '@/components/report/DetailedReport';
import {
  getHydrationStats,
  getScanByReportId,
  getScansForWeek,
} from '@/lib/database';
import { buildDetailedReport } from '@/lib/reportEngine';
import { exportReportPdf } from '@/lib/pdf/exportReport';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import type { DetailedReportData, Scan } from '@/types';

export default function ReportScreen() {
  return (
    <ErrorBoundary>
      <Report />
    </ErrorBoundary>
  );
}

function Report() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const isPro = usePurchaseStore((s) => s.isPro);

  const [scan, setScan] = useState<Scan | null>(null);
  const [reportData, setReportData] = useState<DetailedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadReport = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const s = await getScanByReportId(reportId);
      if (!s) {
        setScan(null);
        setReportData(null);
        return;
      }
      setScan(s);
      const [weekScans, stats] = await Promise.all([
        getScansForWeek(),
        getHydrationStats(),
      ]);
      setReportData(
        buildDetailedReport({
          scan: s,
          weekScans,
          averageScore: stats.averageScore,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const onUnlocked = useCallback(() => {
    // Entitlement is global; the store updates itself on successful purchase.
  }, []);

  const headerLevelColor = useMemo(
    () => reportData?.levelColor ?? Colors.primary,
    [reportData?.levelColor],
  );

  async function handleDownload() {
    if (!reportData || exporting) return;
    setExporting(true);
    try {
      await exportReportPdf(reportData);
    } catch (e) {
      console.warn('exportReportPdf failed', e);
    } finally {
      setExporting(false);
    }
  }

  if (loading || !reportId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!scan || !reportData) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Report</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Report not found</Text>
          <Text style={styles.emptyText}>
            This report may have been removed or never finished saving.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: headerLevelColor + '33' }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Close report"
        >
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>
          {isPro ? 'Detailed Report' : 'Unlock Pro'}
        </Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isPro ? (
          <>
            <DetailedReport data={reportData} />
            <Pressable
              onPress={handleDownload}
              disabled={exporting}
              style={[styles.downloadButton, exporting && styles.disabled]}
              accessibilityRole="button"
              accessibilityLabel="Download report as PDF"
            >
              {exporting ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color={Colors.primary} />
                  <Text style={styles.downloadText}>Download PDF</Text>
                </>
              )}
            </Pressable>
          </>
        ) : (
          <Paywall level={scan.level} onUnlocked={onUnlocked} />
        )}
        <DisclaimerBanner variant="inline" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h3, color: Colors.text },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  emptyTitle: { ...Typography.h2, color: Colors.text, marginTop: Spacing.md },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  downloadButton: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: Radii.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    minHeight: 52,
    ...Shadows.card,
  },
  downloadText: { ...Typography.bodyBold, color: Colors.primary },
  disabled: { opacity: 0.5 },
});
