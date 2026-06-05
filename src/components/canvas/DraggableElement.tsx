import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CanvasElement } from '@/types';
import { getSticker } from '@/assets/stickers/manifest';
import { CUSTOM_PREFIX, useCustomStickerStore } from '@/state/customStickerStore';
import { colors } from '@/theme/tokens';

const HANDLE = 32;

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
  onRemove: (id: string) => void;
  /** Commit final transform (in canvas-ref units) to the store on gesture end. */
  onCommit: (id: string, t: { x: number; y: number; scale: number; rotation: number }) => void;
}

/**
 * A canvas element (text or sticker) that can be dragged, pinch-scaled and rotated.
 * When selected it shows a selection frame with corner handles: delete, edit,
 * one-finger resize, and rotate. Gestures drive reanimated shared values at 60fps.
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
  onRemove,
  onCommit,
}: Props) {
  const isText = element.type === 'text';
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if (editing && element.type === 'text') setDraft(element.text);
  }, [editing]);

  // Center position in SCREEN coordinates + transform.
  const cx = useSharedValue(element.x * displayScale);
  const cy = useSharedValue(element.y * displayScale);
  const scale = useSharedValue(element.scale);
  const rotation = useSharedValue(element.rotation);

  // Measured (unscaled) size of the content, for frame + handle placement.
  const w = useSharedValue(0);
  const h = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRot = useSharedValue(0);

  useEffect(() => {
    cx.value = element.x * displayScale;
    cy.value = element.y * displayScale;
    scale.value = element.scale;
    rotation.value = element.rotation;
  }, [element.x, element.y, element.scale, element.rotation, displayScale]);

  const startEdit = () => onStartEdit(element.id);
  const commitText = () => {
    const t = draft.trim();
    if (t && element.type === 'text') onCommitText(element.id, t);
    onEndEdit();
  };
  const commit = () => {
    onCommit(element.id, {
      x: cx.value / displayScale,
      y: cy.value / displayScale,
      scale: scale.value,
      rotation: rotation.value,
    });
  };

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
      scale.value = Math.max(0.25, Math.min(8, startScale.value * e.scale));
    })
    .onEnd(() => runOnJS(commit)());

  const twoFingerRotate = Gesture.Rotation()
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

  const taps = Gesture.Exclusive(doubleTap, singleTap);
  const composed = Gesture.Simultaneous(taps, pan, pinch, twoFingerRotate);

  // One-finger resize via the bottom-right handle.
  const resize = Gesture.Pan()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      const ref = Math.max(60, Math.max(w.value, h.value));
      let ns = startScale.value + (e.translationX + e.translationY) / ref;
      ns = ns < 0.25 ? 0.25 : ns > 8 ? 8 : ns;
      scale.value = ns;
    })
    .onEnd(() => runOnJS(commit)());

  // One-finger rotate via the bottom-left handle.
  const rotateHandle = Gesture.Pan()
    .onStart(() => {
      startRot.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = startRot.value + (e.translationX - e.translationY) * 0.01;
    })
    .onEnd(() => runOnJS(commit)());

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - w.value / 2 },
      { translateY: cy.value - h.value / 2 },
      { rotateZ: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  const frameStyle = useAnimatedStyle(() => {
    const fw = w.value * scale.value;
    const fh = h.value * scale.value;
    return {
      width: fw,
      height: fh,
      transform: [
        { translateX: cx.value - fw / 2 },
        { translateY: cy.value - fh / 2 },
        { rotateZ: `${rotation.value}rad` },
      ],
    };
  });

  // Corner handle positions (sx, sy in {-1, 1}), rotated around the center.
  const cornerStyle = (sx: number, sy: number) =>
    useAnimatedStyle(() => {
      const hw = (w.value * scale.value) / 2;
      const hh = (h.value * scale.value) / 2;
      const lx = sx * hw;
      const ly = sy * hh;
      const cos = Math.cos(rotation.value);
      const sin = Math.sin(rotation.value);
      const rx = lx * cos - ly * sin;
      const ry = lx * sin + ly * cos;
      return {
        transform: [
          { translateX: cx.value + rx - HANDLE / 2 },
          { translateY: cy.value + ry - HANDLE / 2 },
        ],
      };
    });

  const tl = cornerStyle(-1, -1);
  const tr = cornerStyle(1, -1);
  const bl = cornerStyle(-1, 1);
  const br = cornerStyle(1, 1);

  const textStyle =
    element.type === 'text'
      ? ({
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

  const showHandles = selected && editable && !editing;

  return (
    <>
      <GestureDetector gesture={composed}>
        <Animated.View
          onLayout={(e) => {
            w.value = e.nativeEvent.layout.width;
            h.value = e.nativeEvent.layout.height;
          }}
          style={[styles.wrap, contentStyle]}
        >
          {content}
        </Animated.View>
      </GestureDetector>

      {showHandles && (
        <>
          <Animated.View pointerEvents="none" style={[styles.frame, frameStyle]} />

          {/* Delete (top-left) */}
          <Animated.View style={[styles.handlePos, tl]}>
            <Pressable style={[styles.handle, styles.danger]} hitSlop={8} onPress={() => onRemove(element.id)}>
              <Ionicons name="close" size={17} color="#fff" />
            </Pressable>
          </Animated.View>

          {/* Edit (top-right) — text only */}
          {isText && (
            <Animated.View style={[styles.handlePos, tr]}>
              <Pressable style={[styles.handle, styles.accent]} hitSlop={8} onPress={startEdit}>
                <Ionicons name="pencil" size={15} color="#fff" />
              </Pressable>
            </Animated.View>
          )}

          {/* Rotate (bottom-left) */}
          <GestureDetector gesture={rotateHandle}>
            <Animated.View style={[styles.handlePos, bl]}>
              <Animated.View style={styles.handle}>
                <Ionicons name="sync" size={16} color={colors.accent2} />
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          {/* Resize (bottom-right) */}
          <GestureDetector gesture={resize}>
            <Animated.View style={[styles.handlePos, br]}>
              <Animated.View style={styles.handle}>
                <Ionicons name="resize" size={16} color={colors.accent2} />
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </>
      )}
    </>
  );
}

function StickerView({ assetId, displayScale }: { assetId: string; displayScale: number }) {
  const isCustom = assetId.startsWith(CUSTOM_PREFIX);
  const customUri = useCustomStickerStore((s) =>
    isCustom ? s.uriById[assetId.slice(CUSTOM_PREFIX.length)] : undefined,
  );

  if (isCustom) {
    if (!customUri) return null;
    return (
      <Animated.Image
        source={{ uri: customUri }}
        style={{ width: 170 * displayScale, height: 170 * displayScale }}
        resizeMode="contain"
      />
    );
  }

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
  frame: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 1,
    borderColor: colors.accent2,
    borderStyle: 'dashed',
  },
  handlePos: { position: 'absolute', left: 0, top: 0, width: HANDLE, height: HANDLE },
  handle: {
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  accent: { backgroundColor: colors.accent2, borderColor: colors.accent2 },
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
