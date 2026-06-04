import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients } from '@/theme';

/**
 * 모든 화면의 베이스가 되는 다크 그라데이션 배경.
 * 은은한 보라/핑크 글로우를 코너에 깔아 글래스 카드가 떠 보이게 한다.
 */
export function GradientBackground({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={gradients.night}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* 코너 글로우 */}
      <LinearGradient
        colors={['rgba(181,123,255,0.28)', 'transparent']}
        style={styles.glowTop}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(255,123,197,0.20)']}
        style={styles.glowBottom}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 360,
    height: 360,
    borderRadius: 360,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    right: -90,
    width: 360,
    height: 360,
    borderRadius: 360,
  },
});
