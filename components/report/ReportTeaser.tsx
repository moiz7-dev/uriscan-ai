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

      {/* Blur + fade layered together over the preview rows */}
      <BlurView intensity={22} tint="light" style={styles.blurOverlay} />

      <LinearGradient
        colors={['rgba(248,250,252,0.0)', 'rgba(248,250,252,0.92)']}
        style={styles.fade}
        pointerEvents="none"
      />

      {/* Lock badge — centered at the bottom of the fade zone */}
      <View style={styles.lockBadgeWrap} pointerEvents="none">
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={14} color={Colors.primaryDark} />
          <Text style={styles.lockText}>Tap below to unlock</Text>
        </View>
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
    padding: Spacing.xl,
    paddingBottom: Spacing.xl + Spacing.lg, // extra bottom room for lock badge
    gap: Spacing.base,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowFirst: { borderTopWidth: 0, paddingTop: 0 },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },

  rowText: { flex: 1, gap: 7 },

  rowTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    lineHeight: 22,
  },

  rowLine1: {
    height: 8,
    width: '88%',
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  rowLine2: {
    height: 8,
    width: '60%',
    borderRadius: 4,
    backgroundColor: Colors.border,
  },

  /* Blur starts at ~40% from top so the first 2-3 rows read clearly */
  blurOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    bottom: 0,
  },

  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },

  lockBadgeWrap: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentCyanLight,
    paddingVertical: 8,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    borderColor: Colors.accentCyan,
  },
  lockText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.2,
  },
});
