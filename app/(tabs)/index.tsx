import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { DiaryRepository } from '@/data/repositories/DiaryRepository';
import { Diary } from '@/types';
import { DIARY_STYLES } from '@/config/diaryStyles';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function FeedScreen() {
  const [diaries, setDiaries] = useState<Diary[]>([]);

  useFocusEffect(
    useCallback(() => {
      DiaryRepository.list().then(setDiaries);
    }, []),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={diaries}
        keyExtractor={(d) => d.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <DiaryCard diary={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="journal-outline" size={30} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>아직 일기가 없어요</Text>
            <Text style={styles.emptyText}>
              채팅에서 대화를 나누고{'\n'}오늘 하루를 일기로 남겨보세요.
            </Text>
            <Pressable onPress={() => router.push('/chat')} style={[styles.cta, styles.ctaFill]}>
              <Text style={styles.ctaText}>대화 시작하기</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

function DiaryCard({ diary }: { diary: Diary }) {
  const styleConf = DIARY_STYLES[diary.style];
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/diary/${diary.id}`)}>
      {diary.coverImageUri ? (
        <Image source={{ uri: diary.coverImageUri }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          {diary.sentences.slice(0, 3).map((s) => (
            <Text key={s.id} style={styles.fallbackText} numberOfLines={1}>
              {s.text}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {diary.title}
        </Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {diary.mood ?? styleConf.displayName}
        </Text>
      </View>
    </Pressable>
  );
}

const GAP = spacing.md;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, flexGrow: 1 },
  row: { gap: GAP },
  card: {
    flex: 1,
    marginBottom: GAP,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cover: { width: '100%', aspectRatio: 1000 / 1400, backgroundColor: colors.surface },
  coverFallback: { padding: spacing.md, gap: 6, justifyContent: 'center' },
  fallbackText: { ...typography.caption, color: colors.text },
  cardMeta: { padding: spacing.md },
  cardTitle: { ...typography.bodyStrong, fontSize: 14 },
  cardSub: { ...typography.tiny, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing.xxl * 2 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.heading, marginBottom: spacing.xs },
  emptyText: { ...typography.caption, textAlign: 'center', lineHeight: 20 },
  cta: { marginTop: spacing.xl, borderRadius: radius.pill, overflow: 'hidden' },
  ctaFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  ctaText: { color: colors.onPrimary, fontWeight: '700', fontSize: 15 },
});
