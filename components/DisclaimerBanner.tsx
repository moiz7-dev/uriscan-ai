import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface Props {
  style?: ViewStyle;
  variant?: 'subtle' | 'inline';
}

export function DisclaimerBanner({ style, variant = 'subtle' }: Props) {
  return (
    <View
      accessible
      accessibilityRole="text"
      style={[styles.container, variant === 'inline' && styles.inline, style]}
    >
      <Text style={styles.text}>
        For wellness insights only. Not a medical diagnostic tool.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  inline: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
  },
  text: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
