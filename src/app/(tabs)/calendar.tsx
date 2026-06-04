import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Backdrop } from "@/components/screen";
import { MoodTile } from "@/components/mood-badge";
import { useDiary } from "@/lib/store";
import { moodOf } from "@/lib/moods";
import { todayISO } from "@/lib/utils";
import type { Entry } from "@/lib/types";
import { colors, fonts, radius } from "@/theme";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries } = useDiary();
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const byDate = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const e of entries) if (!map.has(e.date)) map.set(e.date, e);
    return map;
  }, [entries]);

  const today = todayISO();
  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthEntries = entries.filter((e) =>
    e.date.startsWith(`${view.y}-${pad(view.m + 1)}`),
  );

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <Backdrop>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 130,
        }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>달력</Text>
            <Text style={styles.sub}>이번 달 {monthEntries.length}편 기록</Text>
          </View>
          <View style={styles.nav}>
            <Pressable onPress={() => shift(-1)} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.month}>
              {view.y}.{pad(view.m + 1)}
            </Text>
            <Pressable onPress={() => shift(1)} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Calendar grid */}
        <View style={styles.calCard}>
          <View style={styles.weekRow}>
            {WEEK.map((w, i) => (
              <View key={w} style={styles.weekCell}>
                <Text
                  style={[
                    styles.weekText,
                    { color: i === 0 ? "rgba(252,165,165,0.7)" : colors.textFaint },
                  ]}
                >
                  {w}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <View key={`e${idx}`} style={styles.cell} />;
              const date = iso(view.y, view.m, day);
              const entry = byDate.get(date);
              const isToday = date === today;
              return (
                <Pressable
                  key={date}
                  disabled={!entry}
                  onPress={() => entry && router.push(`/entry/${entry.id}`)}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.cellInner,
                      entry && styles.cellFilled,
                      isToday && styles.cellToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellDay,
                        { color: entry ? colors.text : colors.textGhost },
                      ]}
                    >
                      {day}
                    </Text>
                    {entry ? (
                      <MoodTile mood={entry.mood} size={24} />
                    ) : (
                      <View style={styles.cellDot} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* This month list */}
        {monthEntries.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={styles.listTitle}>이번 달의 기록</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {monthEntries.map((e) => {
                const m = moodOf(e.mood);
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => router.push(`/entry/${e.id}`)}
                    style={styles.listItem}
                  >
                    <MoodTile mood={e.mood} size={34} />
                    <Text style={styles.listDate}>
                      {e.date.slice(5).replace("-", ".")}
                    </Text>
                    <Text style={styles.listItemTitle} numberOfLines={1}>
                      {e.title}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: "700", fontFamily: fonts.serif },
  sub: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
  nav: { flexDirection: "row", alignItems: "center", gap: 4 },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderSoft,
  },
  month: {
    minWidth: 78,
    textAlign: "center",
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: fonts.serif,
  },

  calCard: {
    marginTop: 20,
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    borderRadius: radius["2xl"],
    padding: 14,
  },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekCell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 6 },
  weekText: { fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, padding: 3 },
  cellInner: {
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cellFilled: { backgroundColor: colors.glass },
  cellToday: { borderWidth: 1, borderColor: "rgba(167,139,250,0.6)" },
  cellDay: { fontSize: 13 },
  cellDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)" },

  listTitle: { color: colors.text, fontSize: 18, fontWeight: "700", fontFamily: fonts.serif },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listDate: { color: colors.textFaint, fontSize: 13, width: 42 },
  listItemTitle: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "55%" },
});
