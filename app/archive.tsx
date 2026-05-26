import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, SafeAreaView, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DiaryEntry, loadDiaryEntries, deleteDiaryEntry } from '../utils/storage';
import { PERSONAS } from '../constants/personas';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';
import CalendarView from '../components/CalendarView';

export default function ArchiveScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadDiaryEntries().then(setEntries);
    }, [])
  );

  const markedDates = useMemo(() => {
    const map: Record<string, { color: string }[]> = {};
    for (const entry of entries) {
      const dateStr = entry.created_at.slice(0, 10);
      const persona = PERSONAS.find((p) => p.id === entry.persona_id);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push({ color: persona?.accentColor ?? Colors.peach });
    }
    return map;
  }, [entries]);

  const displayedEntries = useMemo(() => {
    if (!selectedDate) return entries;
    return entries.filter((e) => e.created_at.startsWith(selectedDate));
  }, [entries, selectedDate]);

  function confirmDelete(id: string) {
    Alert.alert('일기 삭제', '이 일기를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          await deleteDiaryEntry(id);
          setEntries((prev) => prev.filter((e) => e.id !== id));
        },
      },
    ]);
  }

  function handleDayPress(dateStr: string) {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>일기장</Text>
        {selectedDate && (
          <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearBtn}>
            <Text style={styles.clearText}>전체</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={displayedEntries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <CalendarView markedDates={markedDates} onDayPress={handleDayPress} />
            {selectedDate && (
              <View style={styles.dateLabel}>
                <Text style={styles.dateLabelText}>{formatSelectedDate(selectedDate)}</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => router.push({ pathname: '/diary/[id]', params: { id: item.id } })}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {selectedDate
                ? '이 날은 기록된 일기가 없어요'
                : '아직 저장된 일기가 없어요.\n채팅 후 저장 버튼을 눌러보세요.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function EntryCard({
  entry, onPress, onDelete,
}: {
  entry: DiaryEntry;
  onPress: () => void;
  onDelete: () => void;
}) {
  const persona = PERSONAS.find((p) => p.id === entry.persona_id);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: persona?.accentColor ?? Colors.peach }]}
      activeOpacity={0.82}
      onPress={onPress}
      onLongPress={onDelete}
    >
      <View style={styles.cardTop}>
        <View style={[styles.personaDot, { backgroundColor: persona?.accentColor ?? Colors.peach }]} />
        <Text style={styles.cardPersona}>{persona?.name ?? '친구'}</Text>
        <Text style={styles.cardDate}>{formatDate(entry.created_at)}</Text>
      </View>
      {entry.title ? <Text style={styles.cardTitle}>{entry.title}</Text> : null}
      {entry.summary ? (
        <Text style={styles.cardPreview} numberOfLines={2}>{entry.summary}</Text>
      ) : (
        <Text style={styles.cardPreview} numberOfLines={2}>
          {entry.messages.find((m) => m.role === 'user')?.content ?? ''}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });
}

function formatSelectedDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  clearBtn: { paddingVertical: 4, paddingHorizontal: Spacing.sm },
  clearText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  list: { paddingBottom: Spacing.xl },
  dateLabel: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  dateLabelText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderLeftWidth: 3,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: Spacing.xs },
  personaDot: { width: 6, height: 6, borderRadius: 3 },
  cardPersona: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, flex: 1 },
  cardDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  cardPreview: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: Spacing.xl },
  emptyText: {
    fontSize: FontSize.sm, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22,
  },
});
