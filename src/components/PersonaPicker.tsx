import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { PERSONAS } from '@/data/personas';
import type { PersonaId } from '@/lib/types';
import { PersonaAvatar } from './PersonaBadge';

/** 가로 스크롤 페르소나 선택기. */
export function PersonaPicker({
  selected,
  onSelect,
}: {
  selected: PersonaId;
  onSelect: (id: PersonaId) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {PERSONAS.map((p) => {
        const active = p.id === selected;
        return (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p.id)}
            style={[styles.item, active && styles.itemActive]}
          >
            <PersonaAvatar persona={p.id} size={48} />
            <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
              {p.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  item: {
    width: 76,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  itemActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.glassBorder,
  },
  name: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: fontSize.xs },
  nameActive: { color: colors.text, fontFamily: fonts.bold },
});
