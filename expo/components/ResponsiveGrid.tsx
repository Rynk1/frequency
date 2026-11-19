import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { columnWidth, useResponsive } from '@/lib/ui/responsive';

interface ResponsiveGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  gap?: number;
  /** Override the column count derived from the viewport. */
  columns?: number;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Lays cards out in one column on phones and two or three on tablets.
 *
 * Screens previously rendered a single full-width column, which on a tablet
 * stretches each card to 1000+ px and leaves the page looking like a blown-up
 * phone. Cells are sized from the measured grid width so wrapping is exact.
 */
export function ResponsiveGrid<T>({
  items,
  renderItem,
  keyExtractor,
  gap = 16,
  columns,
  style,
  testID,
}: ResponsiveGridProps<T>) {
  const { gridWidth, columns: responsiveColumns } = useResponsive();
  const count = Math.max(1, columns ?? responsiveColumns);
  const cellWidth = columnWidth(gridWidth, count, gap);

  if (count === 1) {
    return (
      <View testID={testID} style={style}>
        {items.map((item, index) => (
          <View key={keyExtractor(item, index)}>{renderItem(item, index)}</View>
        ))}
      </View>
    );
  }

  return (
    <View testID={testID} style={[styles.grid, { columnGap: gap }, style]}>
      {items.map((item, index) => (
        <View key={keyExtractor(item, index)} style={{ width: cellWidth }}>
          {renderItem(item, index)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
