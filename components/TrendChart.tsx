import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { format, startOfDay, subDays } from 'date-fns';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { getLevelColor } from '@/constants/hydrationData';
import type { Scan } from '@/types';

interface Props {
  scans: Scan[];
  height?: number;
}

interface DailyBucket {
  date: Date;
  label: string;
  score: number;
  level: Scan['level'] | null;
}

function bucketLastSevenDays(scans: Scan[]): DailyBucket[] {
  const today = startOfDay(new Date());
  const buckets: DailyBucket[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = subDays(today, i);
    buckets.push({ date: day, label: format(day, 'EEEEE'), score: 0, level: null });
  }
  for (const scan of scans) {
    const d = startOfDay(new Date(scan.timestamp));
    const idx = buckets.findIndex((b) => b.date.getTime() === d.getTime());
    if (idx >= 0 && scan.score > buckets[idx].score) {
      buckets[idx].score = scan.score;
      buckets[idx].level = scan.level;
    }
  }
  return buckets;
}

export function TrendChart({ scans, height = 160 }: Props) {
  const buckets = bucketLastSevenDays(scans);
  const chartHeight = height;
  const barWidth = 22;
  const barGap = 18;
  const chartWidth = buckets.length * (barWidth + barGap);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Last 7 days</Text>
      <View style={styles.chartRow}>
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>100</Text>
          <Text style={styles.axisLabel}>50</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>
        <View>
          <Svg width={chartWidth} height={chartHeight}>
            <Line
              x1={0}
              y1={chartHeight - 1}
              x2={chartWidth}
              y2={chartHeight - 1}
              stroke={Colors.border}
              strokeWidth={1}
            />
            {buckets.map((b, i) => {
              const h = (b.score / 100) * (chartHeight - 8);
              const x = i * (barWidth + barGap);
              const y = chartHeight - h;
              const fill = b.level ? getLevelColor(b.level) : Colors.border;
              return (
                <Rect
                  key={i}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(h, b.score > 0 ? 2 : 0)}
                  rx={4}
                  fill={fill}
                />
              );
            })}
          </Svg>
          <View style={[styles.xAxis, { width: chartWidth }]}>
            {buckets.map((b, i) => (
              <Text
                key={i}
                style={[styles.axisLabel, { width: barWidth, marginRight: i === buckets.length - 1 ? 0 : barGap }]}
              >
                {b.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    ...Shadows.card,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxis: {
    height: 160,
    justifyContent: 'space-between',
    marginRight: Spacing.sm,
    paddingVertical: 2,
  },
  xAxis: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  axisLabel: {
    ...Typography.micro,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
