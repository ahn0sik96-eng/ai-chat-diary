import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Backdrop } from "@/components/screen";
import { EntryCard } from "@/components/entry-card";
import { useDiary } from "@/lib/store";
import { MOOD_LIST } from "@/lib/moods";
import type { MoodKey } from "@/lib/types";
import { ACCENT_GRADIENT, colors, fonts, radius, spacing } from "@/theme";

export default function EntriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries } = useDiary();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<MoodKey | "all">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "all" && e.mood !== filter) return false;
      if (!needle) return true;
      return (
        e.title.toLowerCase().includes(needle) ||
        e.summary.toLowerCase().includes(needle) ||
        e.tags.some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [entries, q, filter]);

  return (
    <Backdrop>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 130,
        }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>일기장</Text>
            <Text style={styles.count}>
              지금까지 {entries.length}편의 하루가 쌓였어요
            </Text>
          </View>
          <Pressable onPress={() => router.push("/write")}>
            <LinearGradient
              colors={ACCENT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.newBtn}
            >
              <Ionicons name="create" size={16} color={colors.white} />
              <Text style={styles.newText}>새 일기</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={colors.textGhost} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="제목, 내용, 태그로 검색"
            placeholderTextColor={colors.textGhost}
            style={styles.searchInput}
          />
        </View>

        {/* Mood filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Chip active={filter === "all"} onPress={() => setFilter("all")} label="전체" />
          {MOOD_LIST.map((m) => (
            <Chip
              key={m.key}
              active={filter === m.key}
              onPress={() => setFilter(m.key)}
              label={m.label}
              emoji={m.emoji}
            />
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {entries.length === 0
                ? "아직 일기가 없어요. 첫 기록을 남겨보세요."
                : "조건에 맞는 일기가 없어요."}
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            {filtered.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </View>
        )}
      </ScrollView>
    </Backdrop>
  );
}

function Chip({
  active,
  onPress,
  label,
  emoji,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  emoji?: string;
}) {
  if (active) {
    return (
      <LinearGradient
        colors={ACCENT_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.chipActive}
      >
        <Pressable onPress={onPress} style={styles.chipInner}>
          {emoji && <Text style={{ fontSize: 12 }}>{emoji}</Text>}
          <Text style={styles.chipActiveText}>{label}</Text>
        </Pressable>
      </LinearGradient>
    );
  }
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      {emoji && <Text style={{ fontSize: 12 }}>{emoji}</Text>}
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: "700", fontFamily: fonts.serif },
  count: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  newText: { color: colors.white, fontSize: 14, fontWeight: "700" },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },

  filterRow: { gap: 8, paddingVertical: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  chipActive: { borderRadius: radius.pill },
  chipInner: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7 },
  chipActiveText: { color: colors.white, fontSize: 12, fontWeight: "700" },

  empty: {
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    padding: 40,
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
});
