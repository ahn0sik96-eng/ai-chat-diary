import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DiaryRepository } from '@/data/repositories/DiaryRepository';
import { Diary } from '@/types';
import { DIARY_STYLES } from '@/config/diaryStyles';
import { useDecorationStore } from '@/state/decorationStore';
import { DiaryCanvas } from '@/components/canvas/DiaryCanvas';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function DiaryView() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const insets = useSafeAreaInsets();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [hasLayout, setHasLayout] = useState(false);
  const [canvasW, setCanvasW] = useState(0);
  const init = useDecorationStore((s) => s.init);

  useEffect(() => {
    if (!diaryId) return;
    (async () => {
      const d = await DiaryRepository.get(diaryId);
      if (!d) return;
      const layout = await DiaryRepository.getLayout(diaryId);
      setDiary(d);
      setHasLayout(!!layout);
      init(d.id, d.sentences, layout);
    })();
  }, [diaryId, init]);

  if (!diary) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const styleConf = DIARY_STYLES[diary.style];

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom header — no native glass capsule around the buttons */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {diary.title}
        </Text>
        <Pressable
          onPress={() => router.push(`/diary/decorate/${diary.id}`)}
          style={styles.editBtn}
          hitSlop={8}
        >
          <Ionicons name="color-wand-outline" size={15} color={colors.onPrimary} />
          <Text style={styles.editBtnText}>꾸미기</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        onLayout={(e) => setCanvasW(e.nativeEvent.layout.width - spacing.lg * 2)}
      >
        <View style={styles.metaRow}>
          <Text style={styles.styleTag}>{styleConf.displayName}</Text>
          {diary.mood ? <Text style={styles.mood}>· {diary.mood}</Text> : null}
          <Text style={styles.date}>{new Date(diary.createdAt).toLocaleDateString('ko-KR')}</Text>
        </View>

        {canvasW > 0 && hasLayout ? (
          <DiaryCanvas width={canvasW} editable={false} />
        ) : (
          <View style={styles.plainCard}>
            {diary.sentences.map((s) => (
              <Text key={s.id} style={styles.plainSentence}>
                {s.text}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  backBtn: { width: 32, height: 32, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { ...typography.heading, flex: 1, textAlign: 'center' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  editBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  styleTag: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  mood: { ...typography.caption, color: colors.textMuted },
  date: { ...typography.caption, marginLeft: 'auto' },
  plainCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  plainSentence: { ...typography.body, fontSize: 16, lineHeight: 26 },
});
