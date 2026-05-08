import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { TEASER_SECTION_TITLES } from '@/lib/teaserCopy';

export function ReportTeaser() {
  return (
    <View style={styles.wrap} accessibilityLabel="Detailed report preview, locked">
      <View style={styles.previewCard}>
        {TEASER_SECTION_TITLES.map((title, i) => (
          <View key={title} style={[styles.row, i === 0 && styles.rowFirst]}>
            <View style={styles.dot} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{title}</Text>
              <View style={styles.rowLine1} />
              <View style={styles.rowLine2} />
            </View>
          </View>
        ))}
      </View>

      <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />

      <LinearGradient
        colors={['rgba(248,250,252,0.0)', 'rgba(248,250,252,0.85)']}
        style={styles.fade}
        pointerEvents="none"
      />

      <View style={styles.lockBadge} pointerEvents="none">
        <Ionicons name="lock-closed" size={14} color={Colors.primary} />
        <Text style={styles.lockText}>Tap below to unlock</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  previewCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowFirst: { borderTopWidth: 0, paddingTop: 0 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  rowText: { flex: 1, gap: 6 },
  rowTitle: { ...Typography.bodyBold, color: Colors.text },
  rowLine1: {
    height: 8,
    width: '92%',
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  rowLine2: {
    height: 8,
    width: '64%',
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  lockBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  lockText: { ...Typography.micro, color: Colors.primary, fontWeight: '700' },
});
