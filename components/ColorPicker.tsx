import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLOR_SWATCHES, type ColorSwatch } from '@/constants/hydrationData';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import type { HydrationColor } from '@/types';

interface Props {
  selected: HydrationColor | null;
  onSelect: (color: HydrationColor) => void;
}

interface SwatchProps {
  swatch: ColorSwatch;
  isSelected: boolean;
  onPress: () => void;
}

const COLUMNS = 4;
const GAP = Spacing.sm; // 8px between items
// Subtract outer padding (scroll + card, both sides) then divide into 4 equal columns.
// Spacing.lg * 4 = 20 * 4 = 80px total horizontal padding in the typical container.
const ITEM_WIDTH = Math.floor(
  (Dimensions.get('window').width - Spacing.lg * 4 - (COLUMNS - 1) * GAP) / COLUMNS,
);
const SWATCH_SIZE = Math.floor(ITEM_WIDTH * 0.8);

function Swatch({ swatch, isSelected, onPress }: SwatchProps) {
  return (
    <View style={styles.swatchWrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Select ${swatch.label}`}
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.swatch,
          { backgroundColor: swatch.hex },
          isSelected && styles.swatchSelected,
        ]}
      />
      <Text
        style={[styles.label, isSelected && styles.labelSelected]}
        numberOfLines={2}
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

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GAP,
    rowGap: Spacing.base,
  },
  swatchWrap: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: Radii.base,
    borderWidth: 3,
    borderColor: 'transparent',
    ...Shadows.card,
  },
  swatchSelected: {
    borderColor: Colors.primary,
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
    fontSize: 11,
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
