import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import type { DetailedReportData, SparkPoint } from '@/types';

interface Props {
  data: DetailedReportData;
}

function Sparkline({ spark, color }: { spark: SparkPoint[]; color: string }) {
  if (spark.length < 2) {
    return (
      <Text style={styles.sparkEmpty}>
        More scans this week will populate this chart.
      </Text>
    );
  }
  const W = 280;
  const H = 60;
  const PAD = 6;
  const dx = (W - PAD * 2) / Math.max(1, spark.length - 1);
  const points = spark
    .map(
      (p, i) =>
        `${(PAD + i * dx).toFixed(1)},${(
          PAD +
          (1 - p.score / 100) * (H - PAD * 2)
        ).toFixed(1)}`,
    )
    .join(' ');
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {spark.map((p, i) => (
        <Circle
          key={`${p.date}-${i}`}
          cx={PAD + i * dx}
          cy={PAD + (1 - p.score / 100) * (H - PAD * 2)}
          r={2.5}
          fill={color}
        />
      ))}
    </Svg>
  );
}

function Section({
  title,
  children,
  variant = 'default',
}: {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'warn';
}) {
  return (
    <View
      style={[
        styles.section,
        variant === 'warn' && styles.sectionWarn,
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          variant === 'warn' && styles.sectionTitleWarn,
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export function DetailedReport({ data }: Props) {
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.verdictBand,
          { backgroundColor: data.levelColor + '1F', borderColor: data.levelColor },
        ]}
      >
        <View
          style={[
            styles.swatch,
            { backgroundColor: data.colorHex },
          ]}
        />
        <View style={styles.verdictText}>
          <Text style={[styles.verdictTitle, { color: data.levelColor }]}>
            {data.title}
          </Text>
          <View style={styles.chipRow}>
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>
                Level {data.levelIndex} of {data.levelTotal}
              </Text>
            </View>
            <Text style={styles.scoreText}>
              <Text style={styles.scoreNum}>{data.score}</Text>
              <Text style={styles.scoreUnit}> / 100</Text>
            </Text>
          </View>
          <Text style={styles.verdictMessage}>{data.message}</Text>
        </View>
      </View>

      <Section title="Hydration verdict">
        {data.actionSteps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepBullet}>
              <Text style={styles.stepBulletText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </Section>

      <Section title="Today vs. your 7-day average">
        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.metricLabel}>Today</Text>
            <Text style={styles.metricValue}>{data.score}</Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>7-day avg</Text>
            <Text style={styles.metricValue}>{data.sevenDayAverage}</Text>
          </View>
        </View>
        <View style={styles.sparkWrap}>
          <Sparkline spark={data.spark} color={data.levelColor} />
        </View>
        <Text style={styles.sectionBody}>{data.sevenDayPattern}</Text>
      </Section>

      <Section title="24-hour recovery plan">
        {data.recoveryPlan.map((step, i) => (
          <View
            key={i}
            style={[styles.timelineRow, i === 0 && styles.timelineRowFirst]}
          >
            <Text style={styles.whenLabel}>{step.whenLabel}</Text>
            <Text style={styles.whenText}>{step.text}</Text>
          </View>
        ))}
      </Section>

      <Section title="What this level affects">
        <View style={styles.tilesGrid}>
          {data.bodyImpact.map((b) => (
            <View key={b.system} style={styles.tile}>
              <View style={styles.tileHeader}>
                <Ionicons
                  name={b.icon as never}
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.tileTitle}>{b.system}</Text>
              </View>
              <Text style={styles.tileBody}>{b.impact}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Electrolyte & food cues">
        <Text style={styles.sectionBody}>{data.electrolyteCue}</Text>
      </Section>

      <Section title="Lifestyle nudges">
        {data.lifestyleNudges.map((n, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{n}</Text>
          </View>
        ))}
      </Section>

      {data.doctorChecklist ? (
        <Section title="For your healthcare professional" variant="warn">
          {data.doctorChecklist.map((c, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons
                name="medical"
                size={14}
                color={Colors.danger}
                style={styles.warnIcon}
              />
              <Text style={styles.bulletText}>{c}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      <View style={styles.metaCard}>
        <Text style={styles.metaText}>
          Report ID: {data.reportId.slice(0, 8)}…
        </Text>
        <Text style={styles.metaText}>{data.generatedAt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg },
  verdictBand: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.base,
    borderLeftWidth: 4,
    borderRadius: Radii.lg,
    padding: Spacing.base,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verdictText: { flex: 1, gap: 4 },
  verdictTitle: { ...Typography.h2 },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  levelChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  levelChipText: { ...Typography.micro, color: Colors.primary, fontWeight: '700' },
  scoreText: { ...Typography.bodyBold, color: Colors.text },
  scoreNum: { ...Typography.bodyBold, color: Colors.text },
  scoreUnit: { ...Typography.caption, color: Colors.textMuted },
  verdictMessage: {
    ...Typography.body,
    color: Colors.text,
    marginTop: Spacing.xs,
    lineHeight: 21,
  },
  section: {
    backgroundColor: Colors.card,
    padding: Spacing.base,
    borderRadius: Radii.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  sectionWarn: {
    backgroundColor: '#FEE2E2',
  },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  sectionTitleWarn: { color: Colors.danger },
  sectionBody: { ...Typography.body, color: Colors.text, lineHeight: 21 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBulletText: { ...Typography.micro, color: Colors.primary, fontWeight: '700' },
  stepText: { ...Typography.body, color: Colors.text, flex: 1, lineHeight: 21 },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  metricLabel: { ...Typography.micro, color: Colors.textMuted, textTransform: 'uppercase' },
  metricValue: { ...Typography.h1, color: Colors.text, marginTop: 2 },
  sparkWrap: { alignItems: 'center', paddingVertical: Spacing.sm },
  sparkEmpty: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timelineRowFirst: { borderTopWidth: 0, paddingTop: 0 },
  whenLabel: {
    ...Typography.bodyBold,
    color: Colors.primary,
    width: 96,
  },
  whenText: { ...Typography.body, color: Colors.text, flex: 1, lineHeight: 21 },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  tileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tileTitle: { ...Typography.bodyBold, color: Colors.primary },
  tileBody: { ...Typography.caption, color: Colors.text, lineHeight: 18 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  warnIcon: { marginTop: 4 },
  bulletText: { ...Typography.body, color: Colors.text, flex: 1, lineHeight: 21 },
  metaCard: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  metaText: { ...Typography.micro, color: Colors.textMuted },
});
