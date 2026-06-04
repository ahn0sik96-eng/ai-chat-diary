import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  STICKERS,
  STICKER_CATEGORIES,
  StickerCategory,
} from '@/assets/stickers/manifest';
import { colors, radius, spacing } from '@/theme/tokens';

interface Props {
  onPick: (assetId: string) => void;
}

export function StickerTray({ onPick }: Props) {
  const [cat, setCat] = useState<StickerCategory>('cute');
  const items = STICKERS.filter((s) => s.category === cat);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {STICKER_CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCat(c.id)}
            style={[styles.tab, cat === c.id && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, cat === c.id && styles.tabLabelActive]}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.grid}>
        {items.map((s) => (
          <Pressable key={s.id} style={styles.cell} onPress={() => onPick(s.id)}>
            <Text style={styles.emoji}>{s.type === 'emoji' ? s.value : '🖼️'}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  tabActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabLabelActive: { color: colors.onPrimary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  cell: {
    width: '16.66%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 34 },
});
