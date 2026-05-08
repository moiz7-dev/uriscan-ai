import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  streak: number;
}

export function StreakBadge({ streak }: Props) {
  const label = streak === 1 ? 'day streak' : 'day streak';
  return (
    <View style={styles.card} accessibilityLabel={`${streak} day streak`}>
      <Text style={styles.flame}>🔥</Text>
      <View>
        <Text style={styles.count}>{streak}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.base,
    ...Shadows.card,
  },
  flame: {
    fontSize: 36,
  },
  count: {
    ...Typography.h1,
    color: Colors.text,
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
