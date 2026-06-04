import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/theme';
import { getMood } from '@/data/moods';
import type { Mood } from '@/lib/types';

/** 감정 태그 칩. 기본 이모티콘 대신 커스텀 라인 아이콘 + 라벨. */
export function MoodBadge({ mood, size = 'md' }: { mood: Mood | null; size?: 'sm' | 'md' }) {
  const meta = getMood(mood);
  if (!meta) return null;
  const Icon = meta.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <View
      style={[
        styles.chip,
        size === 'sm' && styles.chipSm,
        { borderColor: `${meta.color}55`, backgroundColor: `${meta.color}1A` },
      ]}
    >
      <Icon size={iconSize} color={meta.color} strokeWidth={2.4} />
      <Text style={[styles.label, { color: meta.color }, size === 'sm' && styles.labelSm]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipSm: { paddingHorizontal: 8, paddingVertical: 3 },
  label: { fontFamily: fonts.bold, fontSize: fontSize.sm },
  labelSm: { fontSize: fontSize.xs },
});
