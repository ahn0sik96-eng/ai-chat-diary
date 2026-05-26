import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { DiaryEntry, loadDiaryEntries, deleteDiaryEntry } from '../utils/storage';
import { PERSONAS } from '../constants/personas';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

export default function ArchiveScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadDiaryEntries().then(setEntries);
    }, [])
  );

  function confirmDelete(id: string) {
    Alert.alert('일기 삭제', '이 일기를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteDiaryEntry(id);
          setEntries((prev) => prev.filter((e) => e.id !== id));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>일기장 📖</Text>
        <Text style={styles.subtitle}>나의 감정 기록들</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <EntryCard entry={item} onDelete={() => confirmDelete(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>
              아직 저장된 일기가 없어요.{'\n'}채팅 후 오른쪽 상단 [저장]을 눌러보세요!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function EntryCard({ entry, onDelete }: { entry: DiaryEntry; onDelete: () => void }) {
  const persona = PERSONAS.find((p) => p.id === entry.persona_id);
  const preview = entry.messages.find((m) => m.role === 'user')?.content ?? '';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: persona?.accentColor ?? Colors.peach }]}
      activeOpacity={0.85}
      onLongPress={onDelete}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardEmoji}>{persona?.emoji ?? '💬'}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardPersona}>{persona?.name ?? '친구'}</Text>
          <Text style={styles.cardDate}>{formatDate(entry.created_at)}</Text>
        </View>
      </View>
      {entry.title ? <Text style={styles.cardTitle}>{entry.title}</Text> : null}
      <Text style={styles.cardPreview} numberOfLines={2}>
        {preview}
      </Text>
      <Text style={styles.cardCount}>{entry.messages.length}개의 메시지 · 길게 눌러 삭제</Text>
    </TouchableOpacity>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.title, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  cardEmoji: { fontSize: 24, marginRight: Spacing.sm },
  cardMeta: { flex: 1 },
  cardPersona: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  cardDate: { fontSize: FontSize.xs, color: Colors.textSecondary },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardPreview: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  cardCount: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
