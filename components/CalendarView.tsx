import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

interface CalendarViewProps {
  markedDates: Record<string, { color: string }[]>; // 'YYYY-MM-DD' → persona colors
  onDayPress: (dateStr: string) => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarView({ markedDates, onDayPress }: CalendarViewProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-based

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = formatDate(today);

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.container}>
      {/* Month nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={prev} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {year}년 {month + 1}월
        </Text>
        <TouchableOpacity onPress={next} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.row}>
        {DAYS.map((d, i) => (
          <Text key={d} style={[styles.dayHeader, i === 0 && styles.sun, i === 6 && styles.sat]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Date cells */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e${idx}`} style={styles.cell} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const marks = markedDates[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const dow = (firstDay + day - 1) % 7;

          return (
            <TouchableOpacity
              key={dateStr}
              style={styles.cell}
              onPress={() => marks.length > 0 && onDayPress(dateStr)}
              activeOpacity={marks.length > 0 ? 0.7 : 1}
            >
              <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                <Text style={[
                  styles.dayNum,
                  isToday && styles.todayNum,
                  dow === 0 && styles.sun,
                  dow === 6 && styles.sat,
                ]}>
                  {day}
                </Text>
              </View>
              {/* Dots */}
              {marks.length > 0 && (
                <View style={styles.dots}>
                  {marks.slice(0, 3).map((m, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: m.color }]} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  navBtn: { padding: Spacing.sm },
  navArrow: { fontSize: 22, color: Colors.text, fontWeight: '300' },
  monthLabel: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  row: { flexDirection: 'row', marginBottom: Spacing.xs },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500', paddingVertical: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285%', alignItems: 'center', paddingVertical: 4 },
  dayCircle: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  todayCircle: { backgroundColor: Colors.text },
  dayNum: { fontSize: FontSize.sm, color: Colors.text },
  todayNum: { color: Colors.surface, fontWeight: '700' },
  sun: { color: '#E05C5C' },
  sat: { color: '#5C7AE0' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
