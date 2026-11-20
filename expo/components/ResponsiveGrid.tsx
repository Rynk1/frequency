import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
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
  const { columns: responsiveColumns, gridInnerWidth } = useResponsive();
  const count = Math.max(1, columns ?? responsiveColumns);

  // The grid is rendered inside a padded column, so its own measured width is
  // the only reliable basis for cell sizes. `gridInnerWidth` is the pre-layout
  // estimate used for the first frame, before `onLayout` reports the truth.
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const availableWidth = measuredWidth > 0 ? measuredWidth : gridInnerWidth;
  const cellWidth = columnWidth(availableWidth, count, gap);

  const handleLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    setMeasuredWidth((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
  };

  if (count === 1) {
    return (
      <View testID={testID} style={style} onLayout={handleLayout}>
        {items.map((item, index) => (
          <View key={keyExtractor(item, index)}>{renderItem(item, index)}</View>
        ))}
      </View>
    );
  }

  return (
    <View testID={testID} style={[styles.grid, { columnGap: gap }, style]} onLayout={handleLayout}>
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
