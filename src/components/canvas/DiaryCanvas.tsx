import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CANVAS_REF, useDecorationStore } from '@/state/decorationStore';
import { colors, radius } from '@/theme/tokens';
import { DraggableElement } from './DraggableElement';

interface Props {
  /** On-screen width of the canvas in px. */
  width: number;
  editable?: boolean;
}

/**
 * Renders the diary background + all canvas elements (sorted by z-order).
 * Forwarded ref points at the inner capturable view (for image export).
 */
export const DiaryCanvas = forwardRef<View, Props>(function DiaryCanvas(
  { width, editable = true },
  ref,
) {
  const elements = useDecorationStore((s) => s.elements);
  const background = useDecorationStore((s) => s.background);
  const selectedId = useDecorationStore((s) => s.selectedId);
  const select = useDecorationStore((s) => s.select);
  const updateTransform = useDecorationStore((s) => s.updateTransform);

  const height = width * (CANVAS_REF.height / CANVAS_REF.width);
  const displayScale = width / CANVAS_REF.width;

  const sorted = useMemo(() => [...elements].sort((a, b) => a.z - b.z), [elements]);

  const bgStyle =
    background.type === 'color'
      ? { backgroundColor: background.value }
      : { backgroundColor: colors.surface };

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.canvas, { width, height }, bgStyle]}
    >
      {/* Tap empty area to deselect */}
      {editable && (
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => select(null)}
        />
      )}
      {sorted.map((el) => (
        <DraggableElement
          key={el.id}
          element={el}
          displayScale={displayScale}
          editable={editable}
          selected={selectedId === el.id}
          onSelect={select}
          onCommit={updateTransform}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
