import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, LayoutChangeEvent, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  DiaryEntry, PlacedSticker, loadDiaryEntries, updateDiaryDecoration,
  loadPurchasedIds,
} from '../../utils/storage';
import { removeBackground } from '../../utils/imageProcessing';
import { PERSONAS } from '../../constants/personas';
import { FONTS, STORE_ITEMS } from '../../constants/decorations';
import { Colors, Radius, Spacing, FontSize } from '../../constants/theme';
import StickerPicker from '../../components/StickerPicker';
import Bubble from '../../components/Bubble';

type Mode = 'read' | 'decorate';
type Tab = 'diary' | 'chat';

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [mode, setMode] = useState<Mode>('read');
  const [tab, setTab] = useState<Tab>('diary');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedFont, setSelectedFont] = useState<string | undefined>(undefined);
  const [unlockedPackIds, setUnlockedPackIds] = useState<string[]>([]);
  const [unlockedFontIds, setUnlockedFontIds] = useState<string[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

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
    Alert.alert('저장 완료', '꾸미기가 저장되었어요.');
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

  async function handlePickPhotoSticker() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;

    setProcessingPhoto(true);
    const cutout = await removeBackground(result.assets[0].uri);
    setProcessingPhoto(false);

    const imageUri = cutout ?? result.assets[0].uri;
    const newSticker: PlacedSticker = {
      id: Date.now().toString(),
      emoji: '',
      imageUri,
      xPct: 20 + Math.random() * 55,
      yPct: 15 + Math.random() * 60,
      size: 80,
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
          <TouchableOpacity style={styles.actionBtn} onPress={() => setMode('decorate')}>
            <Text style={styles.actionBtnText}>꾸미기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.actionBtnText}>{saving ? '저장 중' : '완료'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs (read mode only) */}
      {mode === 'read' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, tab === 'diary' && styles.tabActive]}
            onPress={() => setTab('diary')}
          >
            <Text style={[styles.tabText, tab === 'diary' && styles.tabTextActive]}>일기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'chat' && styles.tabActive]}
            onPress={() => setTab('chat')}
          >
            <Text style={[styles.tabText, tab === 'chat' && styles.tabTextActive]}>대화</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Decorate toolbar */}
      {mode === 'decorate' && (
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontScroll}>
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
          <TouchableOpacity style={styles.stickerAddBtn} onPress={() => setPickerVisible(true)}>
            <Text style={styles.stickerAddText}>스티커</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.stickerAddBtn, { marginLeft: 0 }]} onPress={handlePickPhotoSticker} disabled={processingPhoto}>
            {processingPhoto ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <Text style={styles.stickerAddText}>사진</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Canvas */}
      <View style={styles.canvas} onLayout={onCanvasLayout}>
        {/* Diary tab: summary only */}
        {(mode === 'decorate' || tab === 'diary') && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {entry.summary ? (
              <View style={[styles.summaryCard, { borderLeftColor: persona?.accentColor ?? Colors.peach }]}>
                <Text style={styles.summaryDate}>{formatDate(entry.created_at)}</Text>
                <View style={[styles.personaTag, { backgroundColor: persona?.accentLight ?? Colors.peachLight }]}>
                  <Text style={styles.personaTagText}>{persona?.name ?? '친구'}</Text>
                </View>
                <Text style={[styles.summaryText, selectedFont ? { fontFamily: selectedFont } : null]}>
                  {entry.summary}
                </Text>
              </View>
            ) : (
              <View style={styles.noSummary}>
                <Text style={styles.noSummaryText}>요약된 일기가 없어요.</Text>
              </View>
            )}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* Chat tab: messages only */}
        {mode === 'read' && tab === 'chat' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* Placed stickers (absolute layer, only in decorate mode) */}
        {mode === 'decorate' && stickers.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.sticker,
              {
                left: (s.xPct / 100) * canvasSize.w - s.size / 2,
                top:  (s.yPct / 100) * (canvasSize.h || 400) - s.size / 2,
              },
            ]}
            onLongPress={() => removeSticker(s.id)}
            activeOpacity={0.7}
          >
            {s.imageUri ? (
              <Image source={{ uri: s.imageUri }} style={{ width: s.size, height: s.size }} resizeMode="contain" />
            ) : (
              <Text style={{ fontSize: s.size }}>{s.emoji}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Stickers in read/diary mode (non-interactive) */}
        {mode === 'read' && tab === 'diary' && stickers.map((s) => (
          <View
            key={s.id}
            style={[
              styles.sticker,
              {
                left: (s.xPct / 100) * canvasSize.w - s.size / 2,
                top:  (s.yPct / 100) * (canvasSize.h || 400) - s.size / 2,
              },
            ]}
            pointerEvents="none"
          >
            {s.imageUri ? (
              <Image source={{ uri: s.imageUri }} style={{ width: s.size, height: s.size }} resizeMode="contain" />
            ) : (
              <Text style={{ fontSize: s.size }}>{s.emoji}</Text>
            )}
          </View>
        ))}

        {mode === 'decorate' && stickers.length === 0 && (
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>스티커를 추가해 보세요{'\n'}길게 누르면 삭제됩니다</Text>
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
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 40 },
  backText: { fontSize: FontSize.xl, color: Colors.text },
  headerTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  actionBtn: { width: 60, alignItems: 'flex-end' },
  actionBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.peachDark },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: Spacing.sm + 2, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.peachDark },
  tabText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted },
  tabTextActive: { color: Colors.peachDark, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderBottomWidth: 1,
    borderBottomColor: Colors.border, paddingVertical: Spacing.sm,
  },
  fontScroll: { flex: 1, paddingHorizontal: Spacing.md },
  fontChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, marginRight: Spacing.sm,
    backgroundColor: Colors.grayLight,
  },
  fontChipActive: { borderColor: Colors.peachDark, backgroundColor: Colors.peachLight },
  fontChipText: { fontSize: FontSize.sm, color: Colors.text },
  noItemHint: { fontSize: FontSize.xs, color: Colors.textMuted, alignSelf: 'center' },
  stickerAddBtn: {
    marginRight: Spacing.md, paddingHorizontal: Spacing.md,
    paddingVertical: 6, backgroundColor: Colors.grayLight,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  stickerAddText: { fontSize: FontSize.sm, color: Colors.text },
  canvas: { flex: 1, position: 'relative' },
  scrollContent: { paddingVertical: Spacing.lg },
  summaryCard: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderLeftWidth: 3, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  summaryDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  personaTag: {
    alignSelf: 'flex-start', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    marginBottom: Spacing.md,
  },
  personaTagText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  summaryText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 28 },
  noSummary: { alignItems: 'center', paddingTop: 60 },
  noSummaryText: { fontSize: FontSize.sm, color: Colors.textMuted },
  sticker: { position: 'absolute', zIndex: 10 },
  hint: {
    position: 'absolute', bottom: 120, left: 0, right: 0,
    alignItems: 'center',
  },
  hintText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
