import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  STICKERS,
  STICKER_CATEGORIES,
  StickerCategory,
} from '@/assets/stickers/manifest';
import { CUSTOM_PREFIX, useCustomStickerStore } from '@/state/customStickerStore';
import { colors, radius, spacing } from '@/theme/tokens';

interface Props {
  onPick: (assetId: string) => void;
}

type Tab = 'mine' | StickerCategory;

export function StickerTray({ onPick }: Props) {
  const [tab, setTab] = useState<Tab>('mine');
  const customStickers = useCustomStickerStore((s) => s.stickers);
  const load = useCustomStickerStore((s) => s.load);
  const addFromLibrary = useCustomStickerStore((s) => s.addFromLibrary);
  const remove = useCustomStickerStore((s) => s.remove);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const onAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      const created = await addFromLibrary();
      if (created) onPick(`${CUSTOM_PREFIX}${created.id}`);
    } finally {
      setAdding(false);
    }
  };

  const items = tab === 'mine' ? [] : STICKERS.filter((s) => s.category === tab);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        <Pressable
          onPress={() => setTab('mine')}
          style={[styles.tab, tab === 'mine' && styles.tabActive]}
        >
          <Text style={[styles.tabLabel, tab === 'mine' && styles.tabLabelActive]}>내 스티커</Text>
        </Pressable>
        {STICKER_CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setTab(c.id)}
            style={[styles.tab, tab === c.id && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, tab === c.id && styles.tabLabelActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.grid}>
        {tab === 'mine' && (
          <>
            <Pressable style={styles.cell} onPress={onAdd}>
              <View style={styles.addBtn}>
                <Ionicons name="add" size={26} color={colors.textMuted} />
              </View>
            </Pressable>
            {customStickers.map((s) => (
              <Pressable
                key={s.id}
                style={styles.cell}
                onPress={() => onPick(`${CUSTOM_PREFIX}${s.id}`)}
                onLongPress={() =>
                  Alert.alert('스티커 삭제', '이 스티커를 삭제할까요?', [
                    { text: '취소', style: 'cancel' },
                    { text: '삭제', style: 'destructive', onPress: () => remove(s.id) },
                  ])
                }
              >
                <Image source={{ uri: s.uri }} style={styles.customImg} resizeMode="contain" />
              </Pressable>
            ))}
            {customStickers.length === 0 && (
              <Text style={styles.hint}>+ 를 눌러 사진에서 스티커를 추가하세요.{'\n'}길게 누르면 삭제돼요.</Text>
            )}
          </>
        )}
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
    padding: 4,
  },
  emoji: { fontSize: 34 },
  customImg: { width: '100%', height: '100%' },
  addBtn: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    width: '100%',
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: spacing.xl,
  },
});
