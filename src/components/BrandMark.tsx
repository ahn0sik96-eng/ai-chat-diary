import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon } from 'lucide-react-native';

import { colors, fonts, fontSize, gradients } from '@/theme';

/** 앱 로고/워드마크. 기본 이모티콘 대신 라인 아이콘 + 그라데이션. */
export function BrandMark({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 72 : 40;
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, { width: dim, height: dim, borderRadius: dim / 3 }]}
      >
        <Moon size={dim * 0.5} color={colors.white} strokeWidth={2.2} fill={colors.white} />
      </LinearGradient>
      {size === 'lg' ? <Text style={styles.word}>무디</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  badge: { alignItems: 'center', justifyContent: 'center' },
  word: { color: colors.text, fontFamily: fonts.heavy, fontSize: fontSize.display, letterSpacing: 1 },
});
