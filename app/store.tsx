import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';
import { STORE_ITEMS, StoreItem, STICKER_PACKS, FONTS } from '../constants/decorations';
import { loadPurchasedIds, purchaseItem } from '../utils/storage';

type TabKey = 'font' | 'sticker';

export default function StoreScreen() {
  const [tab, setTab] = useState<TabKey>('font');
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPurchasedIds().then(setPurchasedIds);
    }, [])
  );

  const filtered = STORE_ITEMS.filter((i) => i.type === tab);

  async function handlePurchase(item: StoreItem) {
    if (purchasedIds.includes(item.id)) return;
    Alert.alert(
      `${item.name} 구매`,
      `₩${item.price.toLocaleString()}에 구매하시겠어요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매', onPress: async () => {
            await purchaseItem(item.id);
            setPurchasedIds((prev) => [...prev, item.id]);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>스토어 🛍️</Text>
        <Text style={styles.subtitle}>구매 후 일기를 꾸며보세요</Text>
      </View>

      <View style={styles.tabs}>
        {(['font', 'sticker'] as TabKey[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'font' ? '✍️ 폰트' : '🌸 스티커'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <StoreCard
            item={item}
            owned={purchasedIds.includes(item.id)}
            onPress={() => handlePurchase(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function StoreCard({
  item, owned, onPress,
}: {
  item: StoreItem;
  owned: boolean;
  onPress: () => void;
}) {
  const bgColor = item.type === 'font' ? Colors.lavenderLight : Colors.peachLight;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.preview, { backgroundColor: bgColor }]}>
        {item.type === 'font' ? (
          <Text style={[styles.fontPreview, { fontFamily: item.fontFamily }]}>
            Aa 안녕
          </Text>
        ) : (
          <Text style={styles.stickerPreview}>
            {STICKER_PACKS[item.packId!]?.stickers.slice(0, 4).join(' ')}
          </Text>
        )}
      </View>

      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>

      {owned ? (
        <View style={styles.ownedBadge}>
          <Text style={styles.ownedText}>✓ 보유 중</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.priceBtn} onPress={onPress}>
          <Text style={styles.priceText}>₩{item.price.toLocaleString()}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.title, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row', marginHorizontal: Spacing.lg,
    backgroundColor: Colors.gray, borderRadius: Radius.full,
    padding: 3, marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.surface },
  tabText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.text, fontWeight: '700' },
  grid: { padding: Spacing.md },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  card: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  preview: {
    height: 90, borderRadius: Radius.sm, alignItems: 'center',
    justifyContent: 'center', marginBottom: Spacing.sm,
  },
  fontPreview: { fontSize: 22, color: Colors.text },
  stickerPreview: { fontSize: 20 },
  itemName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  priceBtn: {
    backgroundColor: Colors.peach, borderRadius: Radius.full,
    paddingVertical: 6, alignItems: 'center',
  },
  priceText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  ownedBadge: {
    backgroundColor: Colors.grayLight, borderRadius: Radius.full,
    paddingVertical: 6, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  ownedText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
});
