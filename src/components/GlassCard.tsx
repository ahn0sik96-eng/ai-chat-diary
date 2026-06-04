import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { colors, radius } from '@/theme';

/**
 * 글래스모피즘 표면. 네이티브에서는 BlurView 로 배경을 블러 처리하고,
 * 웹에서는 BlurView 지원이 제한적이라 반투명 색으로 폴백한다.
 */
export function GlassCard({
  children,
  style,
  intensity = 24,
  padded = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  padded?: boolean;
}) {
  const inner = (
    <View style={[styles.border, padded && styles.padded, style]}>
      {children}
    </View>
  );

  if (Platform.OS === 'web') {
    return <View style={[styles.webGlass, styles.radius]}>{inner}</View>;
  }

  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.radius, styles.blur]}>
      {inner}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  radius: { borderRadius: radius.lg, overflow: 'hidden' },
  blur: { backgroundColor: colors.glass },
  webGlass: { backgroundColor: colors.glassStrong },
  border: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  padded: { padding: 16 },
});
