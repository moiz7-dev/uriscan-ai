import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLOR_SWATCHES, type ColorSwatch } from '@/constants/hydrationData';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import type { HydrationColor } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  selected: HydrationColor | null;
  onSelect: (color: HydrationColor) => void;
}

interface SwatchProps {
  swatch: ColorSwatch;
  isSelected: boolean;
  onPress: () => void;
}

function Swatch({ swatch, isSelected, onPress }: SwatchProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.1 : 1, { damping: 10, stiffness: 180 });
  }, [isSelected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.swatchWrap}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Select ${swatch.label}`}
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.swatch,
          { backgroundColor: swatch.hex },
          isSelected && styles.swatchSelected,
          animatedStyle,
        ]}
      />
      <Text
        style={[styles.label, isSelected && styles.labelSelected]}
        numberOfLines={1}
      >
        {swatch.label}
      </Text>
    </View>
  );
}

export function ColorPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {COLOR_SWATCHES.map((swatch) => (
        <Swatch
          key={swatch.id}
          swatch={swatch}
          isSelected={selected === swatch.id}
          onPress={() => onSelect(swatch.id)}
        />
      ))}
    </View>
  );
}

const SWATCH_SIZE = 72;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
  },
  swatchWrap: {
    width: '23%',
    alignItems: 'center',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: Radii.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
