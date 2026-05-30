import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, SafeAreaView, Alert, Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DiaryEntry, loadDiaryEntries, deleteDiaryEntry } from '../utils/storage';
import { PERSONAS } from '../constants/personas';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';
import CalendarView from '../components/CalendarView';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const SIDE_PAD = 16;
const CARD_W = (SCREEN_W - SIDE_PAD * 2 - CARD_GAP) / 2;
const COVER_H = Math.round(CARD_W * 0.55);

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

  const ListHeader = (
    <>
      <CalendarView markedDates={markedDates} onDayPress={handleDayPress} />
      {selectedDate && (
        <View style={styles.dateLabel}>
          <Text style={styles.dateLabelText}>{formatSelectedDate(selectedDate)}</Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>일기장</Text>
        <View style={styles.headerRight}>
          {selectedDate && (
            <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearBtn}>
              <Text style={styles.clearText}>전체</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/chat')}
            activeOpacity={0.8}
          >
            <Text style={styles.newBtnTxt}>+ 새 일기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={displayedEntries}
        keyExtractor={(e) => e.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <NotebookCard
            entry={item}
            onPress={() => router.push({ pathname: '/diary/[id]', params: { id: item.id } })}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📓</Text>
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

function NotebookCard({
  entry, onPress, onDelete,
}: {
  entry: DiaryEntry;
  onPress: () => void;
  onDelete: () => void;
}) {
  const persona = PERSONAS.find((p) => p.id === entry.persona_id);
  const accentColor = persona?.accentColor ?? Colors.peach;
  const accentLight = persona?.accentLight ?? Colors.peachLight;
  const coverEmoji = entry.emotionEmoji ?? persona?.emoji ?? '📔';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={onPress}
      onLongPress={onDelete}
    >
      {/* Cover area */}
      <View style={[styles.cover, { backgroundColor: accentLight }]}>
        {/* Persona badge */}
        <View style={[styles.personaBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.personaBadgeTxt}>{persona?.name ?? '친구'}</Text>
        </View>
        {/* Big emoji */}
        <Text style={styles.coverEmoji}>{coverEmoji}</Text>
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        {entry.title ? (
          <Text style={styles.cardTitle} numberOfLines={2}>{entry.title}</Text>
        ) : (
          <Text style={styles.cardTitle} numberOfLines={2}>
            {entry.messages.find((m) => m.role === 'user')?.content ?? '새 일기'}
          </Text>
        )}
        <Text style={styles.cardDate}>{formatDate(entry.created_at)}</Text>
        <Text style={[styles.cardCount, { color: accentColor }]}>
          {entry.messages.length}개의 대화
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', weekday: 'short',
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  clearBtn: { paddingVertical: 4, paddingHorizontal: Spacing.sm },
  clearText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  newBtn: {
    backgroundColor: '#E8874A',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  newBtnTxt: { fontSize: FontSize.xs, fontWeight: '700', color: '#FFFFFF' },

  list: { paddingBottom: Spacing.xl, paddingHorizontal: SIDE_PAD },
  columnWrapper: { gap: CARD_GAP, marginBottom: CARD_GAP },

  dateLabel: {
    paddingVertical: Spacing.sm,
  },
  dateLabelText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },

  // Notebook card
  card: {
    width: CARD_W,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cover: {
    height: COVER_H,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  personaBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    opacity: 0.9,
  },
  personaBadgeTxt: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  coverEmoji: {
    fontSize: 36,
  },
  cardBody: {
    padding: 10,
    gap: 3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
  },
  cardDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardCount: {
    fontSize: 10,
    fontWeight: '600',
  },

  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: {
    fontSize: FontSize.sm, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22,
  },
});
