import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  DiaryEntry, PlacedSticker, loadDiaryEntries, updateDiaryDecoration,
  loadPurchasedIds,
} from '../../utils/storage';
import { PERSONAS } from '../../constants/personas';
import { FONTS, STORE_ITEMS } from '../../constants/decorations';
import { Colors, Radius, Spacing, FontSize } from '../../constants/theme';
import StickerPicker from '../../components/StickerPicker';
import Bubble from '../../components/Bubble';

type Mode = 'read' | 'decorate';

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [mode, setMode] = useState<Mode>('read');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedFont, setSelectedFont] = useState<string | undefined>(undefined);
  const [unlockedPackIds, setUnlockedPackIds] = useState<string[]>([]);
  const [unlockedFontIds, setUnlockedFontIds] = useState<string[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const [entries, purchased] = await Promise.all([
      loadDiaryEntries(),
      loadPurchasedIds(),
    ]);
    const found = entries.find((e) => e.id === id);
    if (!found) { router.back(); return; }
    setEntry(found);
    setStickers(found.stickers ?? []);
    setSelectedFont(found.font);

    const unlockedPacks = STORE_ITEMS
      .filter((i) => i.type === 'sticker' && purchased.includes(i.id))
      .map((i) => i.packId!);
    const unlockedFonts = STORE_ITEMS
      .filter((i) => i.type === 'font' && purchased.includes(i.id))
      .map((i) => i.id);
    setUnlockedPackIds(unlockedPacks);
    setUnlockedFontIds(unlockedFonts);
  }

  async function handleSave() {
    if (!entry) return;
    setSaving(true);
    await updateDiaryDecoration(entry.id, { font: selectedFont, stickers });
    setSaving(false);
    Alert.alert('저장 완료 ✅', '꾸미기가 저장되었어요!');
    setMode('read');
  }

  function addSticker(emoji: string) {
    const newSticker: PlacedSticker = {
      id: Date.now().toString(),
      emoji,
      xPct: 15 + Math.random() * 65,
      yPct: 10 + Math.random() * 70,
      size: 36,
    };
    setStickers((prev) => [...prev, newSticker]);
  }

  function removeSticker(stickerId: string) {
    Alert.alert('스티커 삭제', '이 스티커를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () =>
        setStickers((prev) => prev.filter((s) => s.id !== stickerId))
      },
    ]);
  }

  function onCanvasLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ w: width, h: height });
  }

  if (!entry) return null;

  const persona = PERSONAS.find((p) => p.id === entry.persona_id);
  const availableFonts = FONTS.filter((f) => unlockedFontIds.includes(f.id));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{entry.title || '일기'}</Text>
        {mode === 'read' ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => setMode('decorate')}>
            <Text style={styles.editBtnText}>꾸미기 ✏️</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.editBtnText}>{saving ? '저장 중…' : '완료 ✅'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Decorate toolbar */}
      {mode === 'decorate' && (
        <View style={styles.toolbar}>
          {/* Font picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontScroll}>
            {/* System default */}
            <TouchableOpacity
              style={[styles.fontChip, !selectedFont && styles.fontChipActive]}
              onPress={() => setSelectedFont(undefined)}
            >
              <Text style={styles.fontChipText}>기본체</Text>
            </TouchableOpacity>
            {availableFonts.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.fontChip, selectedFont === f.fontFamily && styles.fontChipActive]}
                onPress={() => setSelectedFont(f.fontFamily)}
              >
                <Text style={[styles.fontChipText, { fontFamily: f.fontFamily }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
            {availableFonts.length === 0 && (
              <Text style={styles.noItemHint}>스토어에서 폰트를 구매해 보세요</Text>
            )}
          </ScrollView>

          {/* Sticker button */}
          <TouchableOpacity style={styles.stickerAddBtn} onPress={() => setPickerVisible(true)}>
            <Text style={styles.stickerAddText}>🌸 스티커</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Canvas: summary + chat bubbles + placed stickers */}
      <View style={styles.canvas} onLayout={onCanvasLayout}>
        <ScrollView contentContainerStyle={styles.bubbleList}>
          {/* AI-generated diary summary */}
          {entry.summary ? (
            <View style={[styles.summaryCard, { borderLeftColor: persona?.accentColor ?? Colors.peach }]}>
              <Text style={styles.summaryDate}>{formatDate(entry.created_at)}</Text>
              <Text style={[styles.summaryText, selectedFont ? { fontFamily: selectedFont } : null]}>
                {entry.summary}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.dividerLabel}>대화 원문</Text>
            </View>
          ) : null}
          {entry.messages.map((msg, i) => (
            <Bubble
              key={i}
              role={msg.role}
              content={msg.content}
              accentColor={persona?.accentColor}
              accentLight={persona?.accentLight}
              timestamp={msg.timestamp}
              fontFamily={selectedFont}
            />
          ))}
          {/* Bottom padding so stickers don't overlap last bubble */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Placed stickers (absolute layer) */}
        {stickers.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.sticker,
              {
                left: (s.xPct / 100) * canvasSize.w - s.size / 2,
                top:  (s.yPct / 100) * (canvasSize.h || 400) - s.size / 2,
              },
            ]}
            onLongPress={() => mode === 'decorate' && removeSticker(s.id)}
            activeOpacity={mode === 'decorate' ? 0.7 : 1}
          >
            <Text style={{ fontSize: s.size }}>{s.emoji}</Text>
          </TouchableOpacity>
        ))}

        {mode === 'decorate' && stickers.length === 0 && (
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>스티커를 추가해 보세요 🌸{'\n'}꾹 누르면 삭제됩니다</Text>
          </View>
        )}
      </View>

      <StickerPicker
        visible={pickerVisible}
        unlockedPackIds={unlockedPackIds}
        onSelect={addSticker}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  summaryCard: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderLeftWidth: 4, padding: Spacing.lg,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  summaryDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },
  summaryText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 26 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  dividerLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 40 },
  backText: { fontSize: FontSize.xl, color: Colors.text },
  headerTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  editBtn: { width: 72, alignItems: 'flex-end' },
  editBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.peachDark },
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderBottomWidth: 1,
    borderBottomColor: Colors.border, paddingVertical: Spacing.sm,
  },
  fontScroll: { flex: 1, paddingHorizontal: Spacing.md },
  fontChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border, marginRight: Spacing.sm,
    backgroundColor: Colors.grayLight,
  },
  fontChipActive: { borderColor: Colors.peachDark, backgroundColor: Colors.peachLight },
  fontChipText: { fontSize: FontSize.sm, color: Colors.text },
  noItemHint: { fontSize: FontSize.xs, color: Colors.textMuted, alignSelf: 'center' },
  stickerAddBtn: {
    marginRight: Spacing.md, paddingHorizontal: Spacing.md,
    paddingVertical: 6, backgroundColor: Colors.peachLight,
    borderRadius: Radius.full,
  },
  stickerAddText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  canvas: { flex: 1, position: 'relative' },
  bubbleList: { paddingVertical: Spacing.md },
  sticker: { position: 'absolute', zIndex: 10 },
  hint: {
    position: 'absolute', bottom: 140, left: 0, right: 0,
    alignItems: 'center', pointerEvents: 'none',
  },
  hintText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
