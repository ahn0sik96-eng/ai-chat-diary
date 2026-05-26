import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Image, PanResponder, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
  ActivityIndicator, Alert,
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

// ─── DraggableSticker ─────────────────────────────────────────────────────

interface DraggableStickerProps {
  sticker: PlacedSticker;
  canvasW: number;
  canvasH: number;
  onMove: (id: string, xPct: number, yPct: number) => void;
  onDelete: (id: string) => void;
}

const DraggableSticker = React.memo(function DraggableSticker({
  sticker,
  canvasW,
  canvasH,
  onMove,
  onDelete,
}: DraggableStickerProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const absPos = useRef({
    x: (sticker.xPct / 100) * canvasW - sticker.size / 2,
    y: (sticker.yPct / 100) * canvasH - sticker.size / 2,
  });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);

  // Initialise pan to absolute position
  useEffect(() => {
    pan.setValue({ x: absPos.current.x, y: absPos.current.y });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as unknown as { _value: number })._value, y: (pan.y as unknown as { _value: number })._value });
        pan.setValue({ x: 0, y: 0 });
        moved.current = false;

        longPressTimer.current = setTimeout(() => {
          if (!moved.current) {
            Alert.alert('스티커 삭제', '이 스티커를 삭제할까요?', [
              { text: '취소', style: 'cancel' },
              { text: '삭제', style: 'destructive', onPress: () => onDelete(sticker.id) },
            ]);
          }
        }, 600);
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) {
          moved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_, gs);
      },
      onPanResponderRelease: (_, gs) => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        pan.flattenOffset();
        const newX = (pan.x as unknown as { _value: number })._value;
        const newY = (pan.y as unknown as { _value: number })._value;
        absPos.current = { x: newX, y: newY };

        const xPct = Math.min(98, Math.max(2, ((newX + sticker.size / 2) / canvasW) * 100));
        const yPct = Math.min(98, Math.max(2, ((newY + sticker.size / 2) / (canvasH || 620)) * 100));
        onMove(sticker.id, xPct, yPct);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.stickerAbsolute,
        { left: pan.x, top: pan.y, width: sticker.size, height: sticker.size },
      ]}
      {...panResponder.panHandlers}
    >
      {sticker.imageUri ? (
        <Image
          source={{ uri: sticker.imageUri }}
          style={{ width: sticker.size, height: sticker.size }}
          resizeMode="contain"
        />
      ) : (
        <Text style={{ fontSize: sticker.size * 0.85 }}>{sticker.emoji}</Text>
      )}
    </Animated.View>
  );
});

// ─── LinedBackground ──────────────────────────────────────────────────────

function LinedBackground({ height }: { height: number }) {
  const lines = [];
  for (let y = 130; y < Math.max(height, 620); y += 32) {
    lines.push(
      <View
        key={y}
        style={{
          position: 'absolute',
          left: 44,
          right: 0,
          top: y,
          height: 1,
          backgroundColor: '#E8DDD0',
        }}
      />
    );
  }
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{lines}</View>;
}

// ─── SpiralRings ──────────────────────────────────────────────────────────

function SpiralRings({ height }: { height: number }) {
  const rings = [];
  const totalH = Math.max(height, 620);
  for (let y = 40; y < totalH; y += 52) {
    rings.push(
      <View key={y} style={[styles.spiralRing, { top: y - 10 }]} />
    );
  }
  // Must be absolutely positioned to escape the page's paddingLeft: 56
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 44 }} pointerEvents="none">
      {rings}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

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
  const [summaryText, setSummaryText] = useState('');
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
    setSummaryText(found.summary ?? '');

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
    await updateDiaryDecoration(entry.id, { font: selectedFont, stickers, summary: summaryText });
    setEntry((prev) => prev ? { ...prev, summary: summaryText } : null);
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

  function moveSticker(id: string, xPct: number, yPct: number) {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, xPct, yPct } : s));
  }

  function deleteSticker(stickerId: string) {
    setStickers((prev) => prev.filter((s) => s.id !== stickerId));
  }

  if (!entry) return null;

  const persona = PERSONAS.find((p) => p.id === entry.persona_id);
  const availableFonts = FONTS.filter((f) => unlockedFontIds.includes(f.id));
  const canvasH = canvasSize.h || 620;

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
          {/* Sticker picker button */}
          <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => setPickerVisible(true)}>
            <Text style={styles.toolbarIconText}>🎀</Text>
          </TouchableOpacity>
          {/* Photo sticker button */}
          <TouchableOpacity
            style={styles.toolbarIconBtn}
            onPress={handlePickPhotoSticker}
            disabled={processingPhoto}
          >
            {processingPhoto ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <Text style={styles.toolbarIconText}>📷</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Page */}
      <ScrollView scrollEnabled={mode === 'read'} contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={[styles.page, { minHeight: 620 }]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setCanvasSize({ w: width, h: height });
          }}
        >
          {/* Ruled lines */}
          <LinedBackground height={canvasH} />

          {/* Spiral rings */}
          <SpiralRings height={canvasH} />

          {/* Left margin line */}
          <View style={styles.marginLine} />

          {/* Page header: date + persona stamp */}
          <View style={styles.pageHeader}>
            <Text style={styles.dateText}>
              {entry.emotionEmoji ? `${entry.emotionEmoji}  ` : ''}
              {formatDate(entry.created_at)}
            </Text>
            {persona && (
              <View style={[styles.personaStamp, { backgroundColor: persona.accentLight ?? Colors.peachLight }]}>
                <Text style={styles.personaStampText}>{persona.emoji} {persona.name}</Text>
              </View>
            )}
          </View>

          {/* Diary content (diary tab or decorate mode) */}
          {(mode === 'decorate' || tab === 'diary') && (
            <View style={styles.diaryContent}>
              {mode === 'decorate' ? (
                <TextInput
                  value={summaryText}
                  onChangeText={setSummaryText}
                  multiline
                  scrollEnabled={false}
                  placeholder="일기를 입력해 보세요"
                  placeholderTextColor={Colors.textMuted}
                  style={[
                    styles.diaryText,
                    styles.diaryInput,
                    selectedFont ? { fontFamily: selectedFont } : null,
                  ]}
                />
              ) : entry.summary ? (
                <Text style={[
                  styles.diaryText,
                  selectedFont ? { fontFamily: selectedFont } : null,
                ]}>
                  {entry.summary}
                </Text>
              ) : (
                <Text style={styles.noSummaryText}>요약된 일기가 없어요.</Text>
              )}
            </View>
          )}

          {/* Chat tab content (read mode only) */}
          {mode === 'read' && tab === 'chat' && (
            <View style={styles.chatContent}>
              {entry.messages.map((msg, i) => (
                <Bubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  accentColor={persona?.accentColor}
                  accentLight={persona?.accentLight}
                  timestamp={msg.timestamp}
                  fontFamily={selectedFont}
                  imageUri={msg.imageUri}
                />
              ))}
            </View>
          )}

          {/* Draggable stickers (decorate mode) */}
          {mode === 'decorate' && canvasSize.w > 0 && stickers.map((s) => (
            <DraggableSticker
              key={s.id}
              sticker={s}
              canvasW={canvasSize.w}
              canvasH={canvasH}
              onMove={moveSticker}
              onDelete={deleteSticker}
            />
          ))}

          {/* Static stickers (read mode, diary tab) */}
          {mode === 'read' && tab === 'diary' && canvasSize.w > 0 && stickers.map((s) => (
            <View
              key={s.id}
              style={[
                styles.stickerAbsolute,
                {
                  left: (s.xPct / 100) * canvasSize.w - s.size / 2,
                  top: (s.yPct / 100) * canvasH - s.size / 2,
                  width: s.size,
                  height: s.size,
                },
              ]}
              pointerEvents="none"
            >
              {s.imageUri ? (
                <Image
                  source={{ uri: s.imageUri }}
                  style={{ width: s.size, height: s.size }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ fontSize: s.size * 0.85 }}>{s.emoji}</Text>
              )}
            </View>
          ))}

          {/* Hint in decorate mode when no stickers */}
          {mode === 'decorate' && stickers.length === 0 && (
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>스티커를 추가해 보세요{'\n'}길게 누르면 삭제됩니다</Text>
            </View>
          )}

          <View style={{ height: 160 }} />
        </View>
      </ScrollView>

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
  safe: { flex: 1, backgroundColor: '#FEF9EF' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 40 },
  backText: { fontSize: FontSize.xl, color: Colors.text },
  headerTitle: {
    flex: 1, fontSize: FontSize.md, fontWeight: '600',
    color: Colors.text, textAlign: 'center',
  },
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
  toolbarIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm,
    backgroundColor: Colors.grayLight,
    borderWidth: 1, borderColor: Colors.border,
  },
  toolbarIconText: { fontSize: 20 },
  // Page
  page: {
    position: 'relative',
    backgroundColor: '#FEF9EF',
    paddingLeft: 56,
    overflow: 'hidden',
  },
  spiralRing: {
    position: 'absolute', left: 6, width: 20, height: 20, borderRadius: 10,
    borderWidth: 3, borderColor: '#BBBAB5', backgroundColor: '#F9F8F6',
    zIndex: 5,
  },
  marginLine: {
    position: 'absolute', left: 44, top: 0, bottom: 0, width: 1.5,
    backgroundColor: '#F2B8B8', opacity: 0.8, zIndex: 1,
  },
  pageHeader: {
    paddingTop: 24,
    paddingRight: Spacing.md,
    paddingBottom: 12,
    zIndex: 2,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  personaStamp: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  personaStampText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  diaryContent: {
    paddingRight: Spacing.md,
    paddingBottom: Spacing.lg,
    zIndex: 2,
  },
  diaryText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  diaryInput: {
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  noSummaryText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 32,
  },
  chatContent: {
    paddingRight: 0,
    paddingBottom: Spacing.lg,
    zIndex: 2,
    // Chat bubbles handle their own padding
    paddingLeft: 0,
    marginLeft: -56, // offset the page paddingLeft so bubbles go edge-to-edge
  },
  stickerAbsolute: {
    position: 'absolute',
    zIndex: 20,
  },
  hint: {
    position: 'absolute',
    bottom: 180,
    left: 56,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
