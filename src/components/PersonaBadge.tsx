import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, fontSize, radius } from '@/theme';
import { getPersona } from '@/data/personas';
import type { PersonaId } from '@/lib/types';

/** 페르소나 아바타: 그라데이션 원 안에 커스텀 라인 아이콘. */
export function PersonaAvatar({ persona, size = 40 }: { persona: PersonaId; size?: number }) {
  const meta = getPersona(persona);
  const Icon = meta.icon;
  return (
    <LinearGradient
      colors={meta.gradient}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Icon size={size * 0.5} color={colors.white} strokeWidth={2.2} />
    </LinearGradient>
  );
}

/** 페르소나 이름 칩 (아바타 + 이름). */
export function PersonaBadge({ persona }: { persona: PersonaId }) {
  const meta = getPersona(persona);
  return (
    <View style={styles.chip}>
      <PersonaAvatar persona={persona} size={20} />
      <Text style={styles.name}>{meta.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
    paddingLeft: 3,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  name: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: fontSize.xs },
});
