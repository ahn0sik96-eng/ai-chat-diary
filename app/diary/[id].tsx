import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Dimensions, Image, PanResponder, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  DiaryEntry, DrawingStroke, PlacedSticker,
  loadDiaryEntries, updateDiaryDecoration, deleteDiaryEntry, loadPurchasedIds,
} from '../../utils/storage';
import { removeBackground } from '../../utils/imageProcessing';
import { PERSONAS } from '../../constants/personas';
import { FONTS, STORE_ITEMS } from '../../constants/decorations';
import { Colors, Radius, Spacing, FontSize } from '../../constants/theme';
import { useTextLayout } from '../../hooks/useTextLayout';

import PaperCanvas from '../../components/PaperCanvas';
import StickerGestureView from '../../components/StickerGestureView';
import FloatingPalette, { DrawingTool } from '../../components/FloatingPalette';
import StickerPicker from '../../components/StickerPicker';
import SubjectExtractorModal from '../../components/SubjectExtractorModal';
import WebStickerPicker from '../../components/WebStickerPicker';
import Bubble from '../../components/Bubble';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CANVAS_W = SCREEN_W - 24;
const CANVAS_H = 1300;
const PADDING_X = 20;
const HEADER_H = 140;
const LINE_H = 28;
const FONT_SIZE = 15;

type ScreenMode = 'read' | 'decorate' | 'draw';
type ViewTab   = 'diary' | 'chat';

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ── Entry data ──────────────────────────────────────────────────────────
  const [entry,     setEntry]     = useState<DiaryEntry | null>(null);
  const [stickers,  setStickers]  = useState<PlacedSticker[]>([]);
  const [strokes,   setStrokes]   = useState<DrawingStroke[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [summaryText, setSummaryText] = useState('');
  const [selectedFont, setSelectedFont] = useState<string | undefined>(undefined);
  const [unlockedPackIds, setUnlockedPackIds] = useState<string[]>([]);

  // ── UI state ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<ScreenMode>('read');
  const [tab,  setTab]  = useState<ViewTab>('diary');
  const [saving, setSaving] = useState(false);
  const [fontPanelOpen, setFontPanelOpen] = useState(true);

  // ── Drawing state ───────────────────────────────────────────────────────
  const [drawTool,  setDrawTool]  = useState<DrawingTool>('pencil');
  const [drawColor, setDrawColor] = useState('#1A202C');
  const [liveSvg,   setLiveSvg]  = useState<string | null>(null);
  const drawPathRef = useRef<string | null>(null);

  // ── Snap guides ─────────────────────────────────────────────────────────
  const [snapGuideX, setSnapGuideX] = useState<number | null>(null);
  const [snapGuideY, setSnapGuideY] = useState<number | null>(null);

  // ── Modals ───────────────────────────────────────────────────────────────
  const [pickerVisible,     setPickerVisible]     = useState(false);
  const [webStickerVisible, setWebStickerVisible] = useState(false);
  const [extractorVisible,  setExtractorVisible]  = useState(false);
  const [extractorImageUri, setExtractorImageUri] = useState('');
  const [processingPhoto,   setProcessingPhoto]   = useState(false);

  // ── Undo with two-finger double-tap ─────────────────────────────────────
  const lastTapTime = useRef(0);
  const activeTouches = useRef(0);

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const [entries, purchased] = await Promise.all([loadDiaryEntries(), loadPurchasedIds()]);
    const found = entries.find(e => e.id === id);
    if (!found) { router.back(); return; }
    setEntry(found);
    setStickers(found.stickers ?? []);
    setStrokes(found.drawingStrokes ?? []);
    setSummaryText(found.summary ?? '');
    setSelectedFont(found.font);
    const packs = STORE_ITEMS
      .filter(i => i.type === 'sticker' && purchased.includes(i.id))
      .map(i => i.packId!);
    setUnlockedPackIds(packs);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!entry) return;
    setSaving(true);
    await updateDiaryDecoration(entry.id, {
      font: selectedFont, stickers, summary: summaryText, drawingStrokes: strokes,
    });
    setEntry(prev => prev ? { ...prev, font: selectedFont, stickers, summary: summaryText, drawingStrokes: strokes } : null);
    setSaving(false);
    Alert.alert('저장 완료', '꾸미기가 저장되었어요.');
    setMode('read');
    setFontPanelOpen(true);
  }

  async function handleDelete() {
    if (!entry) return;
    Alert.alert('일기 삭제', '이 일기를 삭제할까요? 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        await deleteDiaryEntry(entry.id);
        router.back();
      }},
    ]);
  }

  // ── Sticker management ───────────────────────────────────────────────────
  function addEmoji(emoji: string) {
    setStickers(prev => [...prev, {
      id: Date.now().toString(), emoji,
      xPct: 10 + Math.random() * 75,
      yPct: 30 + Math.random() * 50,
      size: 44, rotation: 0,
    }]);
  }

  function addPhotoSticker(uri: string) {
    setStickers(prev => [...prev, {
      id: Date.now().toString(), emoji: '',
      imageUri: uri,
      xPct: 20 + Math.random() * 60,
      yPct: 30 + Math.random() * 45,
      size: 100, rotation: 0,
    }]);
  }

  function updateSticker(id: string, xPct: number, yPct: number, size: number, rotation: number) {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, xPct, yPct, size, rotation } : s));
  }

  function deleteSticker(id: string) {
    Alert.alert('스티커 삭제', '이 스티커를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => setStickers(prev => prev.filter(s => s.id !== id)) },
    ]);
  }

  async function handlePickPhotoSticker() {
    setProcessingPhoto(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.9, allowsEditing: false,
    });
    setProcessingPhoto(false);
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const isPng = ((asset as any).mimeType === 'image/png') || uri.toLowerCase().endsWith('.png');
    if (isPng) { addPhotoSticker(uri); return; }

    setExtractorImageUri(uri);
    setExtractorVisible(true);
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  function toolStrokeWidth() {
    switch (drawTool) {
      case 'highlighter': return 20;
      case 'tape':        return 14;
      default:            return 2.5;
    }
  }

  const drawPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => mode === 'draw',
    onMoveShouldSetPanResponder:  () => mode === 'draw',
    onPanResponderGrant: evt => {
      activeTouches.current = evt.nativeEvent.touches.length;
      if (evt.nativeEvent.touches.length >= 2) {
        return;
      }
      const { locationX, locationY } = evt.nativeEvent;
      drawPathRef.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
      setLiveSvg(drawPathRef.current);
    },
    onPanResponderMove: evt => {
      activeTouches.current = evt.nativeEvent.touches.length;
      if (!drawPathRef.current || evt.nativeEvent.touches.length >= 2) return;
      const { locationX, locationY } = evt.nativeEvent;
      drawPathRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
      setLiveSvg(drawPathRef.current);
    },
    onPanResponderRelease: evt => {
      const wasTwoFinger = activeTouches.current >= 2;
      activeTouches.current = 0;

      if (wasTwoFinger) {
        const now = Date.now();
        if (now - lastTapTime.current < 400) {
          handleUndo();
          lastTapTime.current = 0;
        } else {
          lastTapTime.current = now;
        }
        drawPathRef.current = null;
        setLiveSvg(null);
        return;
      }

      const svgPath = drawPathRef.current;
      drawPathRef.current = null;
      setLiveSvg(null);

      if (!svgPath || svgPath.length < 6) return;
      const newStroke: DrawingStroke = {
        svgPath, color: drawColor,
        strokeWidth: toolStrokeWidth(), tool: drawTool,
      };
      setUndoStack(prev => [...prev, strokes]);
      setStrokes(prev => [...prev, newStroke]);
    },
    onPanResponderTerminate: () => {
      drawPathRef.current = null;
      setLiveSvg(null);
      activeTouches.current = 0;
    },
  });

  function handleUndo() {
    setStrokes(undoStack[undoStack.length - 1] ?? []);
    setUndoStack(prev => prev.slice(0, -1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  // ── Text layout ───────────────────────────────────────────────────────────
  const textSegments = useTextLayout(
    summaryText, FONT_SIZE, LINE_H, CANVAS_W, PADDING_X,
    HEADER_H, stickers, CANVAS_H,
  );

  if (!entry) return null;

  const persona = PERSONAS.find(p => p.id === entry.persona_id);
  const createdAt = new Date(entry.created_at);
  const isDrawMode = mode === 'draw';
  const isDecoMode = mode === 'decorate';

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{entry.title || '일기'}</Text>
        <View style={styles.headerRight}>
          {mode === 'read' && (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
                <Text style={styles.iconBtnTxt}>🗑</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setMode('decorate')}>
                <Text style={styles.actionBtnTxt}>꾸미기</Text>
              </TouchableOpacity>
            </>
          )}
          {(isDecoMode || isDrawMode) && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.actionBtnTxt}>{saving ? '저장 중' : '완료'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Read mode tabs ── */}
      {mode === 'read' && (
        <View style={styles.tabBar}>
          {(['diary', 'chat'] as ViewTab[]).map(t => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                {t === 'diary' ? '일기' : '대화'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Font panel ── */}
      {(isDecoMode || isDrawMode) && fontPanelOpen && (
        <View style={styles.fontPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontPanelContent}>
            <TouchableOpacity
              style={[styles.fontChip, !selectedFont && styles.fontChipActive]}
              onPress={() => setSelectedFont(undefined)}
            >
              <Text style={styles.fontChipTxt}>기본체</Text>
            </TouchableOpacity>
            {FONTS.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.fontChip, selectedFont === f.fontFamily && styles.fontChipActive]}
                onPress={() => setSelectedFont(f.fontFamily)}
              >
                <Text style={[styles.fontChipTxt, { fontFamily: f.fontFamily }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Mode toggle bar (decorate ↔ draw) ── */}
      {(isDecoMode || isDrawMode) && (
        <View style={styles.modeBar}>
          <TouchableOpacity
            style={[styles.modeBtn, isDecoMode && styles.modeBtnActive]}
            onPress={() => setMode('decorate')}
          >
            <Text style={styles.modeLabel}>🎀 스티커</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, isDrawMode && styles.modeBtnActive]}
            onPress={() => setMode('draw')}
          >
            <Text style={styles.modeLabel}>✏️ 드로잉</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Main canvas area ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={mode === 'read'}
        showsVerticalScrollIndicator={false}
      >
        {/* Outer card */}
        <View style={styles.card}>
          {/* ──────── Canvas ──────── */}
          <View
            style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative', overflow: 'hidden', borderRadius: 16 }}
            {...(isDrawMode ? drawPanResponder.panHandlers : {})}
          >
            {/* Layer 1: Paper background + drawing strokes */}
            <PaperCanvas
              width={CANVAS_W}
              height={CANVAS_H}
              strokes={strokes}
              currentSvgPath={liveSvg}
              currentTool={drawTool}
              currentColor={drawColor}
              snapGuideX={snapGuideX}
              snapGuideY={snapGuideY}
            />

            {/* Layer 2: Diary header (date, persona, divider) */}
            <View style={styles.pageHeader} pointerEvents="none">
              <View style={styles.dateRow}>
                <View>
                  <Text style={styles.dateDay}>{createdAt.getDate()}</Text>
                  <Text style={styles.dateMonthYear}>
                    {createdAt.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric', weekday: 'short' })}
                  </Text>
                </View>
                {entry.emotionEmoji && <Text style={styles.emotionEmoji}>{entry.emotionEmoji}</Text>}
              </View>
              {persona && (
                <View style={[styles.personaBadge, { backgroundColor: persona.accentLight ?? Colors.peachLight }]}>
                  <Text style={[styles.personaBadgeTxt, { color: persona.accentColor }]}>{persona.emoji} {persona.name}</Text>
                </View>
              )}
              <View style={styles.divider} />
            </View>

            {/* Layer 3a: Text segments (diary content with wrapping) */}
            {(mode === 'read' ? tab === 'diary' : true) && tab !== 'chat' && (
              <View style={StyleSheet.absoluteFill} pointerEvents={isDrawMode ? 'none' : 'auto'}>
                {mode !== 'decorate' ? (
                  // Read mode: rendered word-wrapped segments
                  textSegments.map((seg, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.diaryTxt,
                        selectedFont ? { fontFamily: selectedFont } : undefined,
                        { position: 'absolute', left: seg.x, top: seg.y, maxWidth: seg.maxWidth },
                      ]}
                    >
                      {seg.text}
                    </Text>
                  ))
                ) : (
                  // Decorate mode: editable TextInput
                  <TextInput
                    value={summaryText}
                    onChangeText={setSummaryText}
                    multiline
                    scrollEnabled={false}
                    placeholder="일기를 입력해 보세요"
                    placeholderTextColor={Colors.textMuted}
                    style={[
                      styles.diaryTxt,
                      styles.diaryInput,
                      selectedFont ? { fontFamily: selectedFont } : undefined,
                      { top: HEADER_H, left: PADDING_X, right: PADDING_X },
                    ]}
                  />
                )}
              </View>
            )}

            {/* Layer 3b: Chat bubbles (read mode only) */}
            {mode === 'read' && tab === 'chat' && (
              <View style={[styles.chatContent]}>
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

            {/* Layer 4: Stickers */}
            {(mode === 'read' ? tab === 'diary' : true) && stickers.map(s => (
              <StickerGestureView
                key={s.id}
                sticker={s}
                canvasW={CANVAS_W}
                canvasH={CANVAS_H}
                isInteractive={isDecoMode}
                onUpdate={updateSticker}
                onDelete={deleteSticker}
                onSnapGuide={(x, y) => { setSnapGuideX(x); setSnapGuideY(y); }}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom toolbar (decorate mode) ── */}
      {isDecoMode && (
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolBtn} onPress={() => setFontPanelOpen(v => !v)}>
            <Text style={styles.toolBtnIcon}>Aa</Text>
            <Text style={styles.toolBtnLabel}>폰트</Text>
          </TouchableOpacity>
          <View style={styles.toolDivider} />
          <TouchableOpacity style={styles.toolBtn} onPress={() => setPickerVisible(true)}>
            <Text style={styles.toolBtnIcon}>🎀</Text>
            <Text style={styles.toolBtnLabel}>이모티콘</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => setWebStickerVisible(true)}>
            <Text style={styles.toolBtnIcon}>🌐</Text>
            <Text style={styles.toolBtnLabel}>인터넷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={handlePickPhotoSticker} disabled={processingPhoto}>
            {processingPhoto
              ? <ActivityIndicator size="small" color={Colors.peachDark} />
              : <>
                  <Text style={styles.toolBtnIcon}>✂️</Text>
                  <Text style={styles.toolBtnLabel}>피사체</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── Floating drawing palette ── */}
      {isDrawMode && (
        <FloatingPalette
          activeTool={drawTool}
          activeColor={drawColor}
          onToolChange={setDrawTool}
          onColorChange={setDrawColor}
          onUndo={handleUndo}
          canUndo={undoStack.length > 0}
        />
      )}

      {/* ── Modals ── */}
      <StickerPicker
        visible={pickerVisible}
        unlockedPackIds={unlockedPackIds}
        onSelect={addEmoji}
        onClose={() => setPickerVisible(false)}
      />
      <WebStickerPicker
        visible={webStickerVisible}
        onAdd={addPhotoSticker}
        onClose={() => setWebStickerVisible(false)}
      />
      <SubjectExtractorModal
        visible={extractorVisible}
        imageUri={extractorImageUri}
        onAdd={addPhotoSticker}
        onClose={() => setExtractorVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40 },
  backTxt: { fontSize: FontSize.xl, color: Colors.text },
  headerTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 4 },
  iconBtnTxt: { fontSize: 18 },
  actionBtn: { paddingHorizontal: 4 },
  actionBtnTxt: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.peachDark },

  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm + 2, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.peachDark },
  tabTxt: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted },
  tabTxtActive: { color: Colors.peachDark, fontWeight: '600' },

  fontPanel: {
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.xs,
  },
  fontPanelContent: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  fontChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.grayLight,
  },
  fontChipActive: { borderColor: Colors.peachDark, backgroundColor: Colors.peachLight },
  fontChipTxt: { fontSize: FontSize.sm, color: Colors.text },

  modeBar: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modeBtnActive: { borderBottomColor: Colors.peachDark },
  modeLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },

  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingVertical: 12 },
  card: {
    width: CANVAS_W,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },

  // On-canvas elements
  pageHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 24, paddingHorizontal: PADDING_X, paddingBottom: 8,
  },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 },
  dateDay: { fontSize: 48, fontWeight: '700', color: Colors.text, lineHeight: 52 },
  dateMonthYear: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  emotionEmoji: { fontSize: 40 },
  personaBadge: {
    alignSelf: 'flex-start', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4, marginBottom: 10,
  },
  personaBadgeTxt: { fontSize: FontSize.xs, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#EBEBEB' },

  diaryTxt: { fontSize: FONT_SIZE, color: '#1C1C1E', lineHeight: LINE_H, letterSpacing: 0.1 },
  diaryInput: {
    position: 'absolute',
    padding: 0, textAlignVertical: 'top',
  },
  chatContent: {
    position: 'absolute', top: HEADER_H, left: 0, right: 0, bottom: 0,
    paddingHorizontal: PADDING_X, paddingTop: Spacing.sm,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingVertical: Spacing.sm, gap: Spacing.lg,
  },
  toolBtn: { alignItems: 'center', minWidth: 52 },
  toolBtnIcon: { fontSize: 22, marginBottom: 2, fontWeight: '700' },
  toolBtnLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  toolDivider: { width: 1, height: 32, backgroundColor: Colors.border },
});
