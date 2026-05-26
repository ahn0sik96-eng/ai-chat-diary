import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Image, PanResponder, SafeAreaView,
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

const { width: SCREEN_W } = Dimensions.get('window');
const PAGE_MIN_H = 680;

// ─── DraggableSticker ─────────────────────────────────────────────────────

interface DraggableStickerProps {
  sticker: PlacedSticker;
  canvasW: number;
  canvasH: number;
  onMove: (id: string, xPct: number, yPct: number) => void;
  onDelete: (id: string) => void;
}

const DraggableSticker = React.memo(function DraggableSticker({
  sticker, canvasW, canvasH, onMove, onDelete,
}: DraggableStickerProps) {
  const initX = (sticker.xPct / 100) * canvasW - sticker.size / 2;
  const initY = (sticker.yPct / 100) * canvasH - sticker.size / 2;

  const pan = useRef(new Animated.ValueXY({ x: initX, y: initY })).current;
  const absPos = useRef({ x: initX, y: initY });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        moved.current = false;
        pan.setOffset(absPos.current);
        pan.setValue({ x: 0, y: 0 });
        longPressTimer.current = setTimeout(() => {
          if (!moved.current) {
            Alert.alert('스티커 삭제', '이 스티커를 삭제할까요?', [
              { text: '취소', style: 'cancel' },
              { text: '삭제', style: 'destructive', onPress: () => onDelete(sticker.id) },
            ]);
          }
        }, 600);
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) {
          moved.current = true;
          if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_, g);
      },
      onPanResponderRelease: (_, g) => {
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        pan.flattenOffset();
        if (moved.current) {
          const nx = absPos.current.x + g.dx;
          const ny = absPos.current.y + g.dy;
          absPos.current = { x: nx, y: ny };
          onMove(
            sticker.id,
            Math.max(2, Math.min(98, ((nx + sticker.size / 2) / canvasW) * 100)),
            Math.max(2, Math.min(97, ((ny + sticker.size / 2) / canvasH) * 100)),
          );
        }
      },
      onPanResponderTerminate: () => {
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{ position: 'absolute', left: pan.x, top: pan.y, zIndex: 20 }}
      {...responder.panHandlers}
    >
      {sticker.imageUri ? (
        <Image source={{ uri: sticker.imageUri }} style={{ width: sticker.size, height: sticker.size }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: sticker.size * 0.88, lineHeight: sticker.size + 4 }}>{sticker.emoji}</Text>
      )}
    </Animated.View>
  );
});

// ─── Dot grid background ───────────────────────────────────────────────────

function DotGrid({ width, height }: { width: number; height: number }) {
  if (!width || !height) return null;
  const GAP = 22;
  const dots: React.ReactElement[] = [];
  for (let y = GAP; y < height; y += GAP) {
    for (let x = GAP; x < width; x += GAP) {
      dots.push(
        <View key={`${x}-${y}`} style={{ position: 'absolute', left: x - 1, top: y - 1, width: 2, height: 2, borderRadius: 1, backgroundColor: '#E0E0E0' }} />
      );
    }
  }
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{dots}</View>;
}

// ─── Static sticker ────────────────────────────────────────────────────────

function StaticSticker({ s, canvasW, canvasH }: { s: PlacedSticker; canvasW: number; canvasH: number }) {
  const left = (s.xPct / 100) * canvasW - s.size / 2;
  const top = (s.yPct / 100) * canvasH - s.size / 2;
  return (
    <View style={{ position: 'absolute', left, top, zIndex: 20, width: s.size, height: s.size }} pointerEvents="none">
      {s.imageUri ? (
        <Image source={{ uri: s.imageUri }} style={{ width: s.size, height: s.size }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: s.size * 0.88 }}>{s.emoji}</Text>
      )}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────

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
  const [summaryText, setSummaryText] = useState('');
  const [unlockedPackIds, setUnlockedPackIds] = useState<string[]>([]);
  const [unlockedFontIds, setUnlockedFontIds] = useState<string[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [fontPanelOpen, setFontPanelOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const [entries, purchased] = await Promise.all([loadDiaryEntries(), loadPurchasedIds()]);
    const found = entries.find((e) => e.id === id);
    if (!found) { router.back(); return; }
    setEntry(found);
    setStickers(found.stickers ?? []);
    setSelectedFont(found.font);
    setSummaryText(found.summary ?? '');

    const unlockedPacks = STORE_ITEMS.filter(i => i.type === 'sticker' && purchased.includes(i.id)).map(i => i.packId!);
    const unlockedFonts = STORE_ITEMS.filter(i => i.type === 'font' && purchased.includes(i.id)).map(i => i.id);
    setUnlockedPackIds(unlockedPacks);
    setUnlockedFontIds(unlockedFonts);
  }

  async function handleSave() {
    if (!entry) return;
    setSaving(true);
    await updateDiaryDecoration(entry.id, { font: selectedFont, stickers, summary: summaryText });
    setEntry(prev => prev ? { ...prev, summary: summaryText } : null);
    setSaving(false);
    Alert.alert('저장 완료', '꾸미기가 저장되었어요.');
    setMode('read');
    setFontPanelOpen(false);
  }

  function addSticker(emoji: string) {
    const newSticker: PlacedSticker = {
      id: Date.now().toString(), emoji,
      xPct: 10 + Math.random() * 75,
      yPct: 55 + Math.random() * 30,  // default below text
      size: 44,
    };
    setStickers(prev => [...prev, newSticker]);
  }

  async function handlePickPhotoSticker() {
    Alert.alert(
      '사진 스티커',
      '아이폰에서 사진을 길게 눌러 피사체를 추출하면 투명 배경 스티커가 만들어져요. 그 사진을 선택하면 바로 스티커로 추가됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '사진 선택', onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'], quality: 0.9, allowsEditing: false,
            });
            if (result.canceled || !result.assets[0]) return;

            setProcessingPhoto(true);
            const uri = result.assets[0].uri;
            const isPng = uri.toLowerCase().includes('.png') || result.assets[0].mimeType === 'image/png';
            const cutout = isPng ? null : await removeBackground(uri);
            setProcessingPhoto(false);

            setStickers(prev => [...prev, {
              id: Date.now().toString(), emoji: '',
              imageUri: cutout ?? uri,
              xPct: 15 + Math.random() * 65,
              yPct: 50 + Math.random() * 35,
              size: 90,
            }]);
          },
        },
      ]
    );
  }

  function moveSticker(id: string, xPct: number, yPct: number) {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, xPct, yPct } : s));
  }

  function deleteSticker(stickerId: string) {
    setStickers(prev => prev.filter(s => s.id !== stickerId));
  }

  if (!entry) return null;

  const persona = PERSONAS.find(p => p.id === entry.persona_id);
  const availableFonts = FONTS.filter(f => unlockedFontIds.includes(f.id));
  const canvasH = Math.max(canvasSize.h, PAGE_MIN_H);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { router.back(); }} style={styles.backBtn}>
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

      {/* Read mode tabs */}
      {mode === 'read' && (
        <View style={styles.tabBar}>
          {(['diary', 'chat'] as Tab[]).map(t => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'diary' ? '일기' : '대화'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Font panel (decorate mode) */}
      {mode === 'decorate' && fontPanelOpen && (
        <View style={styles.fontPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontPanelContent}>
            <TouchableOpacity style={[styles.fontChip, !selectedFont && styles.fontChipActive]} onPress={() => setSelectedFont(undefined)}>
              <Text style={styles.fontChipText}>기본체</Text>
            </TouchableOpacity>
            {availableFonts.map(f => (
              <TouchableOpacity key={f.id} style={[styles.fontChip, selectedFont === f.fontFamily && styles.fontChipActive]} onPress={() => setSelectedFont(f.fontFamily)}>
                <Text style={[styles.fontChipText, { fontFamily: f.fontFamily }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
            {availableFonts.length === 0 && (
              <Text style={styles.noFontHint}>스토어에서 폰트를 구매해 보세요</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Page canvas */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={mode === 'read'}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[styles.page, { minHeight: PAGE_MIN_H }]}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            setCanvasSize({ w: width, h: height });
          }}
        >
          {/* Dot grid background */}
          <DotGrid width={canvasSize.w || SCREEN_W} height={canvasH} />

          {/* Date header */}
          <View style={styles.pageHeader}>
            <View style={styles.dateRow}>
              <View>
                <Text style={styles.dateDay}>{new Date(entry.created_at).getDate()}</Text>
                <Text style={styles.dateMonthYear}>
                  {new Date(entry.created_at).toLocaleDateString('ko-KR', { month: 'long', year: 'numeric', weekday: 'short' })}
                </Text>
              </View>
              {entry.emotionEmoji && (
                <Text style={styles.emotionEmoji}>{entry.emotionEmoji}</Text>
              )}
            </View>
            {persona && (
              <View style={[styles.personaBadge, { backgroundColor: persona.accentLight ?? Colors.peachLight }]}>
                <Text style={[styles.personaBadgeText, { color: persona.accentColor }]}>{persona.emoji} {persona.name}</Text>
              </View>
            )}
            <View style={styles.divider} />
          </View>

          {/* Diary text or chat */}
          {(mode === 'decorate' || tab === 'diary') && (
            <View style={styles.textContent}>
              {mode === 'decorate' ? (
                <TextInput
                  value={summaryText}
                  onChangeText={setSummaryText}
                  multiline
                  scrollEnabled={false}
                  placeholder="일기를 입력해 보세요"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.diaryText, styles.diaryInput, selectedFont ? { fontFamily: selectedFont } : null]}
                />
              ) : (
                <Text style={[styles.diaryText, selectedFont ? { fontFamily: selectedFont } : null]}>
                  {entry.summary || <Text style={{ color: Colors.textMuted }}>요약된 일기가 없어요.</Text>}
                </Text>
              )}
            </View>
          )}

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

          {/* Sticker canvas area hint */}
          {mode === 'decorate' && stickers.length === 0 && (
            <View style={styles.stickerHint} pointerEvents="none">
              <Text style={styles.stickerHintText}>아래 툴바에서 스티커를 추가하세요{'\n'}드래그로 자유롭게 배치 · 꾹 누르면 삭제</Text>
            </View>
          )}

          {/* Draggable stickers */}
          {mode === 'decorate' && canvasSize.w > 0 && stickers.map(s => (
            <DraggableSticker key={s.id} sticker={s} canvasW={canvasSize.w} canvasH={canvasH} onMove={moveSticker} onDelete={deleteSticker} />
          ))}

          {/* Static stickers */}
          {mode === 'read' && tab === 'diary' && canvasSize.w > 0 && stickers.map(s => (
            <StaticSticker key={s.id} s={s} canvasW={canvasSize.w} canvasH={canvasH} />
          ))}

          <View style={{ height: 200 }} />
        </View>
      </ScrollView>

      {/* Bottom toolbar (decorate mode) */}
      {mode === 'decorate' && (
        <View style={styles.bottomToolbar}>
          <TouchableOpacity style={styles.toolBtn} onPress={() => setFontPanelOpen(v => !v)}>
            <Text style={styles.toolBtnIcon}>Aa</Text>
            <Text style={styles.toolBtnLabel}>폰트</Text>
          </TouchableOpacity>
          <View style={styles.toolDivider} />
          <TouchableOpacity style={styles.toolBtn} onPress={() => setPickerVisible(true)}>
            <Text style={styles.toolBtnIcon}>🎀</Text>
            <Text style={styles.toolBtnLabel}>스티커</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={handlePickPhotoSticker} disabled={processingPhoto}>
            {processingPhoto ? (
              <ActivityIndicator size="small" color={Colors.peachDark} />
            ) : (
              <>
                <Text style={styles.toolBtnIcon}>📷</Text>
                <Text style={styles.toolBtnLabel}>사진</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <StickerPicker
        visible={pickerVisible}
        unlockedPackIds={unlockedPackIds}
        onSelect={addSticker}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },
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
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm + 2, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.peachDark },
  tabText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted },
  tabTextActive: { color: Colors.peachDark, fontWeight: '600' },

  // Font panel
  fontPanel: {
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  fontPanelContent: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  fontChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.grayLight,
  },
  fontChipActive: { borderColor: Colors.peachDark, backgroundColor: Colors.peachLight },
  fontChipText: { fontSize: FontSize.sm, color: Colors.text },
  noFontHint: { fontSize: FontSize.xs, color: Colors.textMuted, alignSelf: 'center' },

  // Page
  scrollArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  page: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pageHeader: { paddingTop: 24, paddingBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 },
  dateDay: { fontSize: 48, fontWeight: '700', color: Colors.text, lineHeight: 52 },
  dateMonthYear: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  emotionEmoji: { fontSize: 40 },
  personaBadge: {
    alignSelf: 'flex-start', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4, marginBottom: 12,
  },
  personaBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#EFEFEF', marginBottom: 4 },

  // Content
  textContent: { paddingVertical: Spacing.sm },
  diaryText: { fontSize: 15, color: '#1C1C1E', lineHeight: 28, letterSpacing: 0.1 },
  diaryInput: { padding: 0, textAlignVertical: 'top', minHeight: 160 },
  chatContent: { paddingBottom: Spacing.sm },

  // Sticker hint
  stickerHint: {
    position: 'absolute', bottom: 240, left: 0, right: 0, alignItems: 'center',
  },
  stickerHintText: { fontSize: FontSize.xs, color: '#CCCCCC', textAlign: 'center', lineHeight: 20 },

  // Bottom toolbar
  bottomToolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  toolBtn: { alignItems: 'center', minWidth: 52 },
  toolBtnIcon: { fontSize: 24, marginBottom: 2 },
  toolBtnLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  toolDivider: { width: 1, height: 32, backgroundColor: Colors.border },
});
