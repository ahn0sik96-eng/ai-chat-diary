import React, { useCallback, useEffect } from 'react';
import { Image, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, runOnJS,
} from 'react-native-reanimated';
import {
  Gesture, GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { PlacedSticker } from '../utils/storage';

const SNAP_THRESHOLD = 18;   // px — center alignment snap
const ROT_SNAP_THRESHOLD = 0.14; // rad ≈ 8°
const SNAP_ANGLES = [0, Math.PI / 12, -Math.PI / 12, Math.PI / 2, -Math.PI / 2, Math.PI];

interface Props {
  sticker: PlacedSticker;
  canvasW: number;
  canvasH: number;
  isInteractive: boolean;
  onUpdate: (id: string, xPct: number, yPct: number, size: number, rotation: number) => void;
  onDelete: (id: string) => void;
  onSnapGuide: (x: number | null, y: number | null) => void;
}

export default function StickerGestureView({
  sticker, canvasW, canvasH, isInteractive, onUpdate, onDelete, onSnapGuide,
}: Props) {
  // Position = top-left corner of the sticker box
  const initLeft = (sticker.xPct / 100) * canvasW - sticker.size / 2;
  const initTop  = (sticker.yPct / 100) * canvasH - sticker.size / 2;

  const tx = useSharedValue(initLeft);
  const ty = useSharedValue(initTop);
  const savedTx = useSharedValue(initLeft);
  const savedTy = useSharedValue(initTop);

  const scale    = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const rot      = useSharedValue(sticker.rotation ?? 0);
  const savedRot = useSharedValue(sticker.rotation ?? 0);

  // Sync when sticker prop changes externally (e.g. after save/reload)
  useEffect(() => {
    const left = (sticker.xPct / 100) * canvasW - sticker.size / 2;
    const top  = (sticker.yPct / 100) * canvasH - sticker.size / 2;
    tx.value = left; savedTx.value = left;
    ty.value = top;  savedTy.value = top;
    rot.value = sticker.rotation ?? 0; savedRot.value = sticker.rotation ?? 0;
  }, [sticker.id, sticker.xPct, sticker.yPct, canvasW, canvasH]);

  const haptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const commitUpdate = useCallback((left: number, top: number, s: number, r: number) => {
    const size = sticker.size * s;
    const cx = left + sticker.size / 2;
    const cy = top + sticker.size / 2;
    const xPct = Math.max(2, Math.min(98, (cx / canvasW) * 100));
    const yPct = Math.max(2, Math.min(98, (cy / canvasH) * 100));
    onUpdate(sticker.id, xPct, yPct, size, r);
    onSnapGuide(null, null);
  }, [sticker, canvasW, canvasH, onUpdate, onSnapGuide]);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      const newTx = savedTx.value + e.translationX;
      const newTy = savedTy.value + e.translationY;

      // Center-X magnetic snap
      const cx = newTx + sticker.size / 2;
      const midX = canvasW / 2;
      if (Math.abs(cx - midX) < SNAP_THRESHOLD) {
        tx.value = midX - sticker.size / 2;
        if (Math.abs(savedTx.value + sticker.size / 2 - midX) >= SNAP_THRESHOLD) {
          runOnJS(haptic)();
        }
        runOnJS(onSnapGuide)(midX, null);
      } else {
        tx.value = newTx;
        runOnJS(onSnapGuide)(null, null);
      }
      ty.value = newTy;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
      runOnJS(commitUpdate)(tx.value, ty.value, scale.value, rot.value);
    });

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.max(0.3, Math.min(5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(commitUpdate)(tx.value, ty.value, scale.value, rot.value);
    });

  const rotation = Gesture.Rotation()
    .onUpdate(e => {
      const newRot = savedRot.value + e.rotation;
      let snapped = newRot;
      for (const snap of SNAP_ANGLES) {
        if (Math.abs(newRot - snap) < ROT_SNAP_THRESHOLD) {
          if (Math.abs(rot.value - snap) >= ROT_SNAP_THRESHOLD) {
            runOnJS(haptic)();
          }
          snapped = snap;
          break;
        }
      }
      rot.value = snapped;
    })
    .onEnd(() => {
      savedRot.value = rot.value;
      runOnJS(commitUpdate)(tx.value, ty.value, scale.value, rot.value);
    });

  const longPress = Gesture.LongPress()
    .minDuration(600)
    .onStart(() => {
      runOnJS(onDelete)(sticker.id);
    });

  const composed = Gesture.Simultaneous(pan, Gesture.Simultaneous(pinch, rotation));
  const finalGesture = Gesture.Exclusive(longPress, composed);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: tx.value,
    top: ty.value,
    width: sticker.size,
    height: sticker.size,
    transform: [{ scale: scale.value }, { rotate: `${rot.value}rad` }],
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
  }));

  if (!isInteractive) {
    // Static render in read mode
    const left = (sticker.xPct / 100) * canvasW - sticker.size / 2;
    const top  = (sticker.yPct / 100) * canvasH - sticker.size / 2;
    return (
      <Animated.View style={[styles.staticSticker, {
        left, top, width: sticker.size, height: sticker.size,
        transform: [{ rotate: `${sticker.rotation ?? 0}rad` }],
      }]} pointerEvents="none">
        {sticker.imageUri
          ? <Image source={{ uri: sticker.imageUri }} style={styles.fill} resizeMode="contain" />
          : <Text style={{ fontSize: sticker.size * 0.88 }}>{sticker.emoji}</Text>}
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={finalGesture}>
      <Animated.View style={animStyle}>
        {sticker.imageUri
          ? <Image source={{ uri: sticker.imageUri }} style={styles.fill} resizeMode="contain" />
          : <Text style={{ fontSize: sticker.size * 0.88, lineHeight: sticker.size + 4 }}>{sticker.emoji}</Text>}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  staticSticker: {
    position: 'absolute', zIndex: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 5, elevation: 6,
  },
});
