import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DiaryRepository } from '@/data/repositories/DiaryRepository';
import { Diary } from '@/types';
import { colors, gradients, radius, shadow, spacing, typography } from '@/theme/tokens';

const MONTHS_BACK = 24;
const MONTHS_FWD = 12;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface Month {
  year: number;
  month: number; // 0-indexed
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Month>>(null);
  const [byDate, setByDate] = useState<Record<string, Diary[]>>({});

  const months = useMemo<Month[]>(() => {
    const now = new Date();
    const out: Month[] = [];
    for (let i = -MONTHS_BACK; i <= MONTHS_FWD; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      out.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return out;
  }, []);
  const initialIndex = MONTHS_BACK;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useFocusEffect(
    useCallback(() => {
      DiaryRepository.list().then((list) => {
        const map: Record<string, Diary[]> = {};
        for (const d of list) {
          const dt = new Date(d.createdAt);
          const k = dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
          (map[k] ||= []).push(d);
        }
        setByDate(map);
      });
    }, []),
  );

  const active = months[activeIndex] ?? months[initialIndex];

  const go = (delta: number) => {
    const i = Math.min(months.length - 1, Math.max(0, activeIndex + delta));
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setActiveIndex(i);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {active.year}. {String(active.month + 1).padStart(2, '0')}
        </Text>
        <View style={styles.nav}>
          <Pressable onPress={() => go(-1)} hitSlop={10} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => go(1)} hitSlop={10} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text
            key={w}
            style={[
              styles.weekday,
              i === 0 && { color: colors.danger },
              i === 6 && { color: colors.accent2 },
            ]}
          >
            {w}
          </Text>
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={months}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollToIndexFailed={() => {}}
        keyExtractor={(m) => `${m.year}-${m.month}`}
        windowSize={3}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== activeIndex) setActiveIndex(i);
        }}
        renderItem={({ item }) => (
          <MonthGrid width={width} year={item.year} month={item.month} byDate={byDate} />
        )}
      />

      <Pressable style={[styles.fab, { bottom: insets.bottom + spacing.md }]} onPress={() => router.push('/chat')}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabFill}
        >
          <Ionicons name="add" size={30} color={colors.onPrimary} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function MonthGrid({
  width,
  year,
  month,
  byDate,
}: {
  width: number;
  year: number;
  month: number;
  byDate: Record<string, Diary[]>;
}) {
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  return (
    <View style={[gridStyles.page, { width }]}>
      {cells.map((d, i) => {
        if (d == null) return <View key={`b${i}`} style={gridStyles.cell} />;
        const diaries = byDate[dateKey(year, month, d)];
        const cover = diaries?.find((x) => x.coverImageUri)?.coverImageUri;
        const has = !!diaries?.length;
        const onPress = () =>
          has ? router.push(`/diary/${diaries![0].id}`) : router.push('/chat');
        return (
          <Pressable key={dateKey(year, month, d)} style={gridStyles.cell} onPress={onPress}>
            <View style={[gridStyles.day, isToday(d) && gridStyles.today]}>
              {cover && <Image source={{ uri: cover }} style={gridStyles.cover} contentFit="cover" />}
              <Text
                style={[
                  gridStyles.num,
                  isToday(d) && gridStyles.todayNum,
                  cover && gridStyles.numOnCover,
                ]}
              >
                {d}
              </Text>
              {has && !cover && <View style={gridStyles.dot} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.display, fontSize: 26 },
  nav: { flexDirection: 'row', gap: spacing.xs },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  weekday: { flex: 1, textAlign: 'center', ...typography.tiny, color: colors.textMuted, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    ...shadow.float,
  },
  fabFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

const gridStyles = StyleSheet.create({
  page: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md },
  cell: { width: `${100 / 7}%`, height: 64, alignItems: 'center', justifyContent: 'center', paddingVertical: 3 },
  day: {
    width: 44,
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  today: { backgroundColor: colors.primary },
  cover: { ...StyleSheet.absoluteFillObject },
  num: { ...typography.body, fontSize: 15, color: colors.text },
  todayNum: { color: colors.onPrimary, fontWeight: '700' },
  numOnCover: { color: colors.onPrimary, fontWeight: '800' },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.accent, marginTop: 3 },
});
