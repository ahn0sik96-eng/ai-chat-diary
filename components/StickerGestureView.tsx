import React, { useRef } from 'react';
import {
  Animated, Image, PanResponder, Text, StyleSheet, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PlacedSticker } from '../utils/storage';

const SNAP_THRESHOLD = 18;
const ROT_SNAP_THRESHOLD = 0.14;
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

function getTouchDistance(touches: any[]) {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchAngle(touches: any[]) {
  return Math.atan2(
    touches[1].pageY - touches[0].pageY,
    touches[1].pageX - touches[0].pageX,
  );
}

export default function StickerGestureView({
  sticker, canvasW, canvasH, isInteractive, onUpdate, onDelete, onSnapGuide,
}: Props) {
  const initLeft = (sticker.xPct / 100) * canvasW - sticker.size / 2;
  const initTop  = (sticker.yPct / 100) * canvasH - sticker.size / 2;

  const posRef   = useRef({ left: initLeft, top: initTop });
  const scaleRef = useRef(1);
  const rotRef   = useRef(sticker.rotation ?? 0);

  const posAnim   = useRef(new Animated.ValueXY({ x: initLeft, y: initTop })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotAnim   = useRef(new Animated.Value(sticker.rotation ?? 0)).current;

  const prevPinchDist  = useRef<number | null>(null);
  const prevPinchAngle = useRef<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMove        = useRef(false);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => isInteractive,
    onMoveShouldSetPanResponder:  () => isInteractive,

    onPanResponderGrant: () => {
      didMove.current = false;
      posAnim.setOffset({ x: posRef.current.left, y: posRef.current.top });
      posAnim.setValue({ x: 0, y: 0 });
      longPressTimer.current = setTimeout(() => {
        if (!didMove.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete(sticker.id);
        }
      }, 600);
    },

    onPanResponderMove: (evt, gs) => {
      const touches = evt.nativeEvent.touches;
      if (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) {
        didMove.current = true;
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      }

      if (touches.length >= 2) {
        const dist  = getTouchDistance(touches);
        const angle = getTouchAngle(touches);

        if (prevPinchDist.current !== null) {
          const newScale = Math.max(0.3, Math.min(5, scaleRef.current * (dist / prevPinchDist.current)));
          scaleRef.current = newScale;
          scaleAnim.setValue(newScale);
        }

        if (prevPinchAngle.current !== null) {
          let newRot = rotRef.current + (angle - prevPinchAngle.current);
          for (const snap of SNAP_ANGLES) {
            if (Math.abs(newRot - snap) < ROT_SNAP_THRESHOLD) {
              if (Math.abs(rotRef.current - snap) >= ROT_SNAP_THRESHOLD) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              newRot = snap;
              break;
            }
          }
          rotRef.current = newRot;
          rotAnim.setValue(newRot);
        }

        prevPinchDist.current  = dist;
        prevPinchAngle.current = angle;
      } else {
        // Single-finger drag with center-X snap
        const absLeft = posRef.current.left + gs.dx;
        const cx = absLeft + sticker.size / 2;
        const midX = canvasW / 2;

        if (Math.abs(cx - midX) < SNAP_THRESHOLD) {
          const snappedDx = midX - sticker.size / 2 - posRef.current.left;
          if (Math.abs((posRef.current.left + gs.dx) - (midX - sticker.size / 2)) >= SNAP_THRESHOLD) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          posAnim.setValue({ x: snappedDx, y: gs.dy });
          onSnapGuide(midX, null);
        } else {
          posAnim.setValue({ x: gs.dx, y: gs.dy });
          onSnapGuide(null, null);
        }
      }
    },

    onPanResponderRelease: () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      posAnim.flattenOffset();
      const finalLeft = (posAnim.x as any)._value;
      const finalTop  = (posAnim.y as any)._value;
      posRef.current = { left: finalLeft, top: finalTop };

      prevPinchDist.current  = null;
      prevPinchAngle.current = null;

      const size = sticker.size * scaleRef.current;
      scaleRef.current = 1;
      scaleAnim.setValue(1);

      const cx   = finalLeft + sticker.size / 2;
      const cy   = finalTop  + sticker.size / 2;
      const xPct = Math.max(2, Math.min(98, (cx / canvasW) * 100));
      const yPct = Math.max(2, Math.min(98, (cy / canvasH) * 100));
      onUpdate(sticker.id, xPct, yPct, size, rotRef.current);
      onSnapGuide(null, null);
    },

    onPanResponderTerminate: () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      posAnim.flattenOffset();
      const finalLeft = (posAnim.x as any)._value;
      const finalTop  = (posAnim.y as any)._value;
      posRef.current = { left: finalLeft, top: finalTop };
      prevPinchDist.current  = null;
      prevPinchAngle.current = null;
    },
  })).current;

  const rotInterp = rotAnim.interpolate({
    inputRange: [-Math.PI * 4, Math.PI * 4],
    outputRange: ['-1440deg', '1440deg'],
  });

  if (!isInteractive) {
    const left = (sticker.xPct / 100) * canvasW - sticker.size / 2;
    const top  = (sticker.yPct / 100) * canvasH - sticker.size / 2;
    return (
      <View
        style={[styles.staticSticker, {
          left, top, width: sticker.size, height: sticker.size,
          transform: [{ rotate: `${sticker.rotation ?? 0}rad` }],
        }]}
        pointerEvents="none"
      >
        {sticker.imageUri
          ? <Image source={{ uri: sticker.imageUri }} style={styles.fill} resizeMode="contain" />
          : <Text style={{ fontSize: sticker.size * 0.88 }}>{sticker.emoji}</Text>}
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.sticker, {
        width:  sticker.size,
        height: sticker.size,
        left:   posAnim.x,
        top:    posAnim.y,
        transform: [{ scale: scaleAnim }, { rotate: rotInterp }],
      }]}
      {...panResponder.panHandlers}
    >
      {sticker.imageUri
        ? <Image source={{ uri: sticker.imageUri }} style={styles.fill} resizeMode="contain" />
        : <Text style={{ fontSize: sticker.size * 0.88, lineHeight: sticker.size + 4 }}>{sticker.emoji}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  sticker: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
  },
  staticSticker: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
  },
});
