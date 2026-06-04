import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { CanvasElement } from '@/types';
import { getSticker } from '@/assets/stickers/manifest';
import { colors } from '@/theme/tokens';

interface Props {
  element: CanvasElement;
  /** displayWidth / CANVAS_REF.width — converts canvas-ref units to on-screen px. */
  displayScale: number;
  selected: boolean;
  editable: boolean;
  onSelect: (id: string) => void;
  /** Commit final transform (in canvas-ref units) to the store on gesture end. */
  onCommit: (id: string, t: { x: number; y: number; scale: number; rotation: number }) => void;
}

/**
 * A single canvas element (text block or sticker) that can be dragged, pinch-scaled,
 * and rotated. Gestures drive reanimated shared values for 60fps; the final transform
 * is committed back to the store when the gesture ends.
 */
function DraggableElementBase({
  element,
  displayScale,
  selected,
  editable,
  onSelect,
  onCommit,
}: Props) {
  // Center position in SCREEN coordinates.
  const cx = useSharedValue(element.x * displayScale);
  const cy = useSharedValue(element.y * displayScale);
  const scale = useSharedValue(element.scale);
  const rotation = useSharedValue(element.rotation);

  // Measured size of the element (screen px), for center-anchored placement.
  const w = useSharedValue(0);
  const h = useSharedValue(0);

  // Gesture start snapshots.
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRot = useSharedValue(0);

  // Keep shared values in sync if the element/displayScale changes externally.
  useEffect(() => {
    cx.value = element.x * displayScale;
    cy.value = element.y * displayScale;
    scale.value = element.scale;
    rotation.value = element.rotation;
  }, [element.x, element.y, element.scale, element.rotation, displayScale]);

  const commit = () => {
    onCommit(element.id, {
      x: cx.value / displayScale,
      y: cy.value / displayScale,
      scale: scale.value,
      rotation: rotation.value,
    });
  };

  const pan = Gesture.Pan()
    .enabled(editable)
    .onStart(() => {
      startX.value = cx.value;
      startY.value = cy.value;
      runOnJS(onSelect)(element.id);
    })
    .onUpdate((e) => {
      cx.value = startX.value + e.translationX;
      cy.value = startY.value + e.translationY;
    })
    .onEnd(() => runOnJS(commit)());

  const pinch = Gesture.Pinch()
    .enabled(editable)
    .onStart(() => {
      startScale.value = scale.value;
      runOnJS(onSelect)(element.id);
    })
    .onUpdate((e) => {
      scale.value = Math.max(0.25, Math.min(6, startScale.value * e.scale));
    })
    .onEnd(() => runOnJS(commit)());

  const rotate = Gesture.Rotation()
    .enabled(editable)
    .onStart(() => {
      startRot.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = startRot.value + e.rotation;
    })
    .onEnd(() => runOnJS(commit)());

  const tap = Gesture.Tap()
    .enabled(editable)
    .onEnd(() => runOnJS(onSelect)(element.id));

  const composed = Gesture.Simultaneous(tap, pan, pinch, rotate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - w.value / 2 },
      { translateY: cy.value - h.value / 2 },
      { rotateZ: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  const content =
    element.type === 'text' ? (
      <Text
        style={[
          styles.text,
          {
            color: element.color,
            fontSize: element.fontSize * displayScale,
            textAlign: element.align,
            opacity: element.hidden ? 0.18 : 1,
          },
        ]}
      >
        {element.text}
      </Text>
    ) : (
      <StickerView assetId={element.assetId} displayScale={displayScale} />
    );

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        onLayout={(e) => {
          w.value = e.nativeEvent.layout.width;
          h.value = e.nativeEvent.layout.height;
        }}
        style={[
          styles.wrap,
          animatedStyle,
          selected && editable && styles.selected,
        ]}
      >
        {content}
      </Animated.View>
    </GestureDetector>
  );
}

function StickerView({ assetId, displayScale }: { assetId: string; displayScale: number }) {
  const sticker = getSticker(assetId);
  if (!sticker) return null;
  if (sticker.type === 'emoji') {
    return <Text style={{ fontSize: 120 * displayScale }}>{sticker.value}</Text>;
  }
  return (
    <Animated.Image
      source={sticker.source}
      style={{ width: 140 * displayScale, height: 140 * displayScale }}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 6,
  },
  selected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  text: {
    maxWidth: 260,
    fontWeight: '600',
    lineHeight: undefined,
  },
});

export const DraggableElement = React.memo(DraggableElementBase);
