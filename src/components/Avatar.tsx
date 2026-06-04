import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, gradients } from '@/theme';

/**
 * 사용자 아바타. 이미지가 없으면 이니셜을 그라데이션 위에 보여준다.
 * `ring` 이면 인스타 스토리식 그라데이션 링을 두른다.
 */
export function Avatar({
  uri,
  name,
  size = 44,
  ring = false,
  gradient = gradients.brand,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
  ring?: boolean;
  gradient?: readonly [string, string];
}) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  const inner = size - (ring ? 6 : 0);

  const face = uri ? (
    <Image source={{ uri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
  ) : (
    <LinearGradient
      colors={gradient}
      style={[styles.fallback, { width: inner, height: inner, borderRadius: inner / 2 }]}
    >
      <Text style={[styles.initial, { fontSize: inner * 0.4 }]}>{initial}</Text>
    </LinearGradient>
  );

  if (!ring) return face;

  return (
    <LinearGradient
      colors={gradients.brand}
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={[styles.ringInner, { borderRadius: inner / 2 }]}>{face}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.white, fontFamily: fonts.bold },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringInner: {
    padding: 2,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
});
