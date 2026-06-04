import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { DiaryRepository } from '@/data/repositories/DiaryRepository';
import { Diary, TextElement } from '@/types';
import { CANVAS_REF, useDecorationStore } from '@/state/decorationStore';
import { DiaryCanvas } from '@/components/canvas/DiaryCanvas';
import { StickerTray } from '@/components/canvas/StickerTray';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

type Panel = 'none' | 'sticker' | 'background';

const TEXT_COLORS = ['#2A2230', '#FF6B9D', '#7C83FD', '#4CAF93', '#F5A623', '#FFFFFF'];

export default function DecorateScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<View>(null);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [canvasW, setCanvasW] = useState(0);
  const [panel, setPanel] = useState<Panel>('none');
  const [saving, setSaving] = useState(false);

  const init = useDecorationStore((s) => s.init);
  const elements = useDecorationStore((s) => s.elements);
  const background = useDecorationStore((s) => s.background);
  const selectedId = useDecorationStore((s) => s.selectedId);
  const addSticker = useDecorationStore((s) => s.addSticker);
  const setBackground = useDecorationStore((s) => s.setBackground);
  const remove = useDecorationStore((s) => s.remove);
  const bringToFront = useDecorationStore((s) => s.bringToFront);
  const undo = useDecorationStore((s) => s.undo);
  const updateTextStyle = useDecorationStore((s) => s.updateTextStyle);
  const toggleTextHidden = useDecorationStore((s) => s.toggleTextHidden);

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    if (!diaryId) return;
    (async () => {
      const d = await DiaryRepository.get(diaryId);
      if (!d) return;
      const layout = await DiaryRepository.getLayout(diaryId);
      setDiary(d);
      init(d.id, d.sentences, layout);
    })();
  }, [diaryId, init]);

  const save = async () => {
    if (!diary) return;
    setSaving(true);
    try {
      await DiaryRepository.saveLayout({
        diaryId: diary.id,
        canvasWidth: CANVAS_REF.width,
        canvasHeight: CANVAS_REF.height,
        background,
        elements,
      });
      // Capture a cover image for the feed.
      try {
        const uri = await captureRef(canvasRef, { format: 'png', quality: 1 });
        await DiaryRepository.setCoverImage(diary.id, uri);
      } catch {
        // capture is best-effort; layout is already saved.
      }
      router.replace(`/diary/${diary.id}`);
    } finally {
      setSaving(false);
    }
  };

  const saveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리에 저장하려면 사진 권한이 필요해요.');
        return;
      }
      const uri = await captureRef(canvasRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('저장 완료', '갤러리에 다이어리를 저장했어요 🌷');
    } catch {
      Alert.alert('저장 실패', '이미지를 저장하지 못했어요.');
    }
  };

  if (!diary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.headerBtn}>닫기</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {diary.title}
        </Text>
        <Pressable onPress={save} hitSlop={10} disabled={saving}>
          <Text style={[styles.headerBtn, styles.headerSave]}>
            {saving ? '저장 중…' : '저장'}
          </Text>
        </Pressable>
      </View>

      {/* Canvas area */}
      <ScrollView
        contentContainerStyle={styles.canvasArea}
        onLayout={(e) => setCanvasW(e.nativeEvent.layout.width - spacing.lg * 2)}
      >
        {canvasW > 0 && <DiaryCanvas ref={canvasRef} width={canvasW} editable />}
      </ScrollView>

      {/* Contextual toolbar for the selected element */}
      {selected && (
        <View style={styles.contextBar}>
          {selected.type === 'text' && (
            <TextControls
              element={selected as TextElement}
              colors={TEXT_COLORS}
              onColor={(c) => updateTextStyle(selected.id, { color: c })}
              onSize={(d) =>
                updateTextStyle(selected.id, {
                  fontSize: Math.max(
                    18,
                    Math.min(120, (selected as TextElement).fontSize + d),
                  ),
                })
              }
              onHide={() => toggleTextHidden(selected.id)}
            />
          )}
          <View style={styles.contextActions}>
            <ToolBtn label="맨 앞으로" onPress={() => bringToFront(selected.id)} />
            {selected.type === 'sticker' && (
              <ToolBtn label="삭제" danger onPress={() => remove(selected.id)} />
            )}
          </View>
        </View>
      )}

      {/* Expandable panel */}
      {panel === 'sticker' && (
        <View style={styles.panel}>
          <StickerTray onPick={(id) => addSticker(id)} />
        </View>
      )}
      {panel === 'background' && (
        <View style={styles.panel}>
          <ScrollView contentContainerStyle={styles.bgRow}>
            {colors.canvasOptions.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  background.value === c && styles.swatchActive,
                ]}
                onPress={() => setBackground({ type: 'color', value: c })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom action bar */}
      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <ActionTab
          icon="🌈"
          label="스티커"
          active={panel === 'sticker'}
          onPress={() => setPanel(panel === 'sticker' ? 'none' : 'sticker')}
        />
        <ActionTab
          icon="🎨"
          label="배경"
          active={panel === 'background'}
          onPress={() => setPanel(panel === 'background' ? 'none' : 'background')}
        />
        <ActionTab icon="↩️" label="실행취소" onPress={undo} />
        <ActionTab icon="⬇️" label="갤러리" onPress={saveToGallery} />
      </View>
    </View>
  );
}

function TextControls({
  element,
  colors: palette,
  onColor,
  onSize,
  onHide,
}: {
  element: TextElement;
  colors: string[];
  onColor: (c: string) => void;
  onSize: (delta: number) => void;
  onHide: () => void;
}) {
  return (
    <View style={styles.textControls}>
      <ToolBtn label="A−" onPress={() => onSize(-6)} />
      <ToolBtn label="A+" onPress={() => onSize(6)} />
      <ToolBtn label={element.hidden ? '보이기' : '숨기기'} onPress={onHide} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.colorRow}>
          {palette.map((c) => (
            <Pressable
              key={c}
              onPress={() => onColor(c)}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                element.color === c && styles.colorDotActive,
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ToolBtn({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.toolBtn, danger && styles.toolBtnDanger]}>
      <Text style={[styles.toolBtnText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

function ActionTab({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionTab} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, active && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBtn: { ...typography.bodyStrong, color: colors.textMuted },
  headerSave: { color: colors.primary },
  headerTitle: { ...typography.bodyStrong, flex: 1, textAlign: 'center', marginHorizontal: spacing.md },
  canvasArea: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  contextBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  textControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contextActions: { flexDirection: 'row', gap: spacing.sm },
  colorRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorDotActive: { borderWidth: 3, borderColor: colors.primary },
  toolBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  toolBtnDanger: { backgroundColor: '#FCE8E9' },
  toolBtnText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  panel: {
    height: 230,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.float,
  },
  bgRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
  },
  swatch: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchActive: { borderWidth: 3, borderColor: colors.primary },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  actionTab: { flex: 1, alignItems: 'center', gap: 2 },
  actionIcon: { fontSize: 22 },
  actionLabel: { ...typography.tiny, color: colors.textMuted },
});
