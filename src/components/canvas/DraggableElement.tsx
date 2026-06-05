import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
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
  editing: boolean;
  onSelect: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCommitText: (id: string, text: string) => void;
  onEndEdit: () => void;
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
  editing,
  onSelect,
  onStartEdit,
  onCommitText,
  onEndEdit,
  onCommit,
}: Props) {
  const isText = element.type === 'text';
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if (editing && element.type === 'text') setDraft(element.text);
  }, [editing]);

  const startEdit = () => onStartEdit(element.id);
  const commitText = () => {
    const t = draft.trim();
    if (t && element.type === 'text') onCommitText(element.id, t);
    onEndEdit();
  };
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

  // While editing text, all manipulation gestures are off so typing works.
  const active = editable && !editing;

  const pan = Gesture.Pan()
    .enabled(active)
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
    .enabled(active)
    .onStart(() => {
      startScale.value = scale.value;
      runOnJS(onSelect)(element.id);
    })
    .onUpdate((e) => {
      scale.value = Math.max(0.25, Math.min(6, startScale.value * e.scale));
    })
    .onEnd(() => runOnJS(commit)());

  const rotate = Gesture.Rotation()
    .enabled(active)
    .onStart(() => {
      startRot.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = startRot.value + e.rotation;
    })
    .onEnd(() => runOnJS(commit)());

  const doubleTap = Gesture.Tap()
    .enabled(active && isText)
    .numberOfTaps(2)
    .onEnd(() => runOnJS(startEdit)());

  const singleTap = Gesture.Tap()
    .enabled(active)
    .onEnd(() => runOnJS(onSelect)(element.id));

  // Double-tap (edit) takes priority over single-tap (select).
  const taps = Gesture.Exclusive(doubleTap, singleTap);
  const composed = Gesture.Simultaneous(taps, pan, pinch, rotate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - w.value / 2 },
      { translateY: cy.value - h.value / 2 },
      { rotateZ: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  const textStyle =
    element.type === 'text'
      ? ({
          // ~88% of the canvas width so long sentences wrap inside, never clipped
          maxWidth: 880 * displayScale,
          color: element.color,
          fontSize: element.fontSize * displayScale,
          lineHeight: element.fontSize * displayScale * 1.35,
          textAlign: element.align,
        } as const)
      : null;

  const content =
    element.type === 'text' ? (
      editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoFocus
          multiline
          selectTextOnFocus
          style={[styles.text, textStyle, styles.editing]}
          onBlur={commitText}
          onSubmitEditing={commitText}
          blurOnSubmit
        />
      ) : (
        <Text style={[styles.text, textStyle, { opacity: element.hidden ? 0.18 : 1 }]}>
          {element.text}
        </Text>
      )
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
    fontWeight: '600',
    padding: 0,
  },
  editing: {
    minWidth: 40,
    backgroundColor: 'rgba(124,77,255,0.10)',
  },
});

export const DraggableElement = React.memo(DraggableElementBase);
