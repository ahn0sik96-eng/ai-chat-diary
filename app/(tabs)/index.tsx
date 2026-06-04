import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { DiaryRepository } from '@/data/repositories/DiaryRepository';
import { Diary } from '@/types';
import { DIARY_STYLES } from '@/config/diaryStyles';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

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
        renderItem={({ item }) => <DiaryCard diary={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📔</Text>
            <Text style={styles.emptyTitle}>아직 일기가 없어요</Text>
            <Text style={styles.emptyText}>
              채팅 탭에서 친구와 대화하고{'\n'}오늘 하루를 일기로 남겨보세요.
            </Text>
            <Pressable style={styles.cta} onPress={() => router.push('/chat')}>
              <Text style={styles.ctaText}>대화 시작하기 →</Text>
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
        <Text style={styles.cardSub}>
          {styleConf.emoji} {diary.mood ?? styleConf.displayName}
        </Text>
      </View>
    </Pressable>
  );
}

const GAP = spacing.md;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  row: { gap: GAP },
  card: {
    flex: 1,
    marginBottom: GAP,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  cover: { width: '100%', aspectRatio: 1000 / 1400, backgroundColor: colors.surfaceAlt },
  coverFallback: { padding: spacing.md, gap: 6, justifyContent: 'center' },
  fallbackText: { ...typography.caption, color: colors.text },
  cardMeta: { padding: spacing.md },
  cardTitle: { ...typography.bodyStrong, fontSize: 14 },
  cardSub: { ...typography.tiny, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: spacing.xxl * 2, gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...typography.heading },
  emptyText: { ...typography.caption, textAlign: 'center', lineHeight: 20 },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.onPrimary, fontWeight: '700' },
});
