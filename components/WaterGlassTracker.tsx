import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  glasses: boolean[];
  onToggle: (index: number) => void;
}

interface GlassProps {
  filled: boolean;
  onPress: () => void;
  index: number;
}

function GlassIcon({ filled }: { filled: boolean }) {
  const strokeColor = filled ? Colors.primary : Colors.border;
  return (
    <Svg width={44} height={54} viewBox="0 0 36 44">
      <Path
        d="M6 4 L30 4 L27 40 Q27 42 25 42 L11 42 Q9 42 9 40 Z"
        fill={Colors.background}
        stroke={strokeColor}
        strokeWidth={2}
      />
      {filled && (
        <Rect
          x={9}
          y={16}
          width={18}
          height={24}
          rx={2}
          fill={Colors.primary}
          opacity={0.85}
        />
      )}
    </Svg>
  );
}

function Glass({ filled, onPress, index }: GlassProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    cancelAnimation(scale);
    scale.value = 1;
    scale.value = withSequence(
      withTiming(1.16, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
    );
    onPress();
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={
        filled
          ? `Glass ${index + 1} filled, tap to roll back to ${index}`
          : `Glass ${index + 1} empty, tap to fill up to ${index + 1}`
      }
      accessibilityState={{ selected: filled }}
      style={[styles.glass, animatedStyle]}
    >
      <GlassIcon filled={filled} />
      <Text style={[styles.label, filled && styles.labelFilled]}>250 ml</Text>
    </AnimatedPressable>
  );
}

export function WaterGlassTracker({ glasses, onToggle }: Props) {
  return (
    <View style={styles.grid}>
      {glasses.map((filled, i) => (
        <Glass key={i} filled={filled} index={i} onPress={() => onToggle(i)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  glass: {
    width: '23%',
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    gap: Spacing.xs,
  },
  label: {
    ...Typography.micro,
    color: Colors.textMuted,
  },
  labelFilled: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
