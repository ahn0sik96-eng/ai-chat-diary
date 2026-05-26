import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';
interface StoreItem {
  id: string;
  type: 'font' | 'sticker';
  name: string;
  preview_url: string;
  price: number;
  is_purchased: boolean;
}

type TabKey = 'font' | 'sticker';

const MOCK_ITEMS: StoreItem[] = [
  { id: '1', type: 'font', name: '사랑스러운 손글씨', preview_url: '', price: 990, is_purchased: false },
  { id: '2', type: 'font', name: '감성 명조체', preview_url: '', price: 1200, is_purchased: true },
  { id: '3', type: 'font', name: '귀여운 둥근체', preview_url: '', price: 990, is_purchased: false },
  { id: '4', type: 'sticker', name: '꽃다발 스티커 팩', preview_url: '', price: 1500, is_purchased: false },
  { id: '5', type: 'sticker', name: '별빛 무드 팩', preview_url: '', price: 1500, is_purchased: true },
  { id: '6', type: 'sticker', name: '고양이 일상 팩', preview_url: '', price: 1200, is_purchased: false },
  { id: '7', type: 'sticker', name: '빈티지 우표 팩', preview_url: '', price: 1500, is_purchased: false },
];

export default function StoreScreen() {
  const [tab, setTab] = useState<TabKey>('font');
  const [items, setItems] = useState(MOCK_ITEMS);

  const filtered = items.filter((i) => i.type === tab);

  function handlePurchase(item: StoreItem) {
    if (item.is_purchased) return;
    Alert.alert(
      `${item.name} 구매`,
      `₩${item.price.toLocaleString()}에 구매하시겠어요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매', onPress: () => {
            setItems((prev) =>
              prev.map((i) => i.id === item.id ? { ...i, is_purchased: true } : i)
            );
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>스토어 🛍️</Text>
        <Text style={styles.subtitle}>다꾸 아이템으로 일기를 꾸며보세요</Text>
      </View>

      {/* Tab bar */}
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
          <StoreCard item={item} onPress={() => handlePurchase(item)} />
        )}
      />
    </SafeAreaView>
  );
}

function StoreCard({ item, onPress }: { item: StoreItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Preview placeholder */}
      <View
        style={[
          styles.preview,
          { backgroundColor: item.type === 'font' ? Colors.lavenderLight : Colors.peachLight },
        ]}
      >
        <Text style={styles.previewEmoji}>
          {item.type === 'font' ? '✍️' : '🌸'}
        </Text>
      </View>

      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>

      {item.is_purchased ? (
        <View style={styles.ownedBadge}>
          <Text style={styles.ownedText}>보유 중</Text>
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
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.gray,
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.surface },
  tabText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.text, fontWeight: '700' },
  grid: { padding: Spacing.md },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  preview: {
    height: 100,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  previewEmoji: { fontSize: 36 },
  itemName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  priceBtn: {
    backgroundColor: Colors.peach,
    borderRadius: Radius.full,
    paddingVertical: 6,
    alignItems: 'center',
  },
  priceText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  ownedBadge: {
    backgroundColor: Colors.grayLight,
    borderRadius: Radius.full,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ownedText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
});
