import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Backdrop } from "@/components/screen";
import { EntryCard } from "@/components/entry-card";
import { MoodBadge, MoodTile } from "@/components/mood-badge";
import { BrandMark, GradientButton } from "@/components/gradient";
import { useDiary } from "@/lib/store";
import { moodOf } from "@/lib/moods";
import type { Entry, MoodKey } from "@/lib/types";
import { formatLongDate, timeOfDayGreeting, todayISO } from "@/lib/utils";
import { ACCENT_GRADIENT, colors, fonts, radius, spacing } from "@/theme";

function computeStreak(entries: Entry[]): number {
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function dominantMood(entries: Entry[]): MoodKey | null {
  if (!entries.length) return null;
  const counts = new Map<MoodKey, number>();
  for (const e of entries) counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries, ready } = useDiary();

  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);
  const recent = entries.slice(0, 6);

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const monthCount = useMemo(() => {
    const ym = today.slice(0, 7);
    return entries.filter((e) => e.date.startsWith(ym)).length;
  }, [entries, today]);
  const mood = useMemo(() => dominantMood(entries), [entries]);
  const moodTrail = [...entries].slice(0, 7).reverse();

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
        {/* Greeting */}
        <View style={styles.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.date}>{formatLongDate(today)}</Text>
            <Text style={styles.greeting}>{timeOfDayGreeting()}</Text>
          </View>
          <BrandMark size={44} />
        </View>

        {/* Hero */}
        {todayEntry ? (
          <Pressable
            onPress={() => router.push(`/entry/${todayEntry.id}`)}
            style={[styles.hero, styles.heroGlass]}
          >
            <View style={styles.heroTopRow}>
              <Text style={styles.heroKicker}>오늘의 기록</Text>
              <MoodBadge mood={todayEntry.mood} size="sm" />
            </View>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {todayEntry.title}
            </Text>
            <Text style={styles.heroSummary} numberOfLines={2}>
              {todayEntry.summary}
            </Text>
            <View style={styles.heroLink}>
              <Text style={styles.heroLinkText}>다시 보기</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.accentSoft} />
            </View>
          </Pressable>
        ) : (
          <LinearGradient
            colors={ACCENT_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBorder}
          >
            <View style={styles.heroInner}>
              <View style={styles.pill}>
                <Ionicons name="sparkles" size={13} color={colors.accentSoft} />
                <Text style={styles.pillText}>아직 오늘을 기록하지 않았어요</Text>
              </View>
              <Text style={styles.ctaTitle}>
                오늘의 마음을{"\n"}
                <Text style={{ color: colors.accentSoft }}>Lumi</Text>에게 들려주세요
              </Text>
              <Text style={styles.ctaSub}>
                가볍게 대화하다 보면 어느새 하루가 한 편의 일기로 정리돼요.
              </Text>
              <GradientButton
                label="오늘 일기 쓰기"
                onPress={() => router.push("/write")}
                icon={<Ionicons name="create" size={16} color={colors.white} />}
                style={{ marginTop: 18, alignSelf: "flex-start" }}
              />
            </View>
          </LinearGradient>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard accent icon="flame" value={`${streak}일`} label="연속 기록" />
          <StatCard icon="book" value={`${monthCount}편`} label="이번 달" />
        </View>
        <View style={[styles.statCard, { marginTop: spacing.md }]}>
          <Text style={{ fontSize: 22 }}>{mood ? moodOf(mood).emoji : "✨"}</Text>
          <View>
            <Text style={styles.statValue}>
              {mood ? moodOf(mood).label : "기록 없음"}
            </Text>
            <Text style={styles.statLabel}>요즘의 기분</Text>
          </View>
        </View>

        {/* Mood trail */}
        {moodTrail.length > 0 && (
          <View style={styles.trail}>
            <Text style={styles.trailLabel}>감정의 흐름</Text>
            <View style={styles.trailRow}>
              {moodTrail.map((e) => (
                <Pressable key={e.id} onPress={() => router.push(`/entry/${e.id}`)}>
                  <MoodTile mood={e.mood} size={34} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Recent entries */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 일기</Text>
          <Pressable
            onPress={() => router.push("/entries")}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>전체 보기</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
          </Pressable>
        </View>

        {!ready ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              아직 일기가 없어요. 첫 번째 하루를 기록해볼까요?
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {recent.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </View>
        )}
      </ScrollView>
    </Backdrop>
  );
}

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statCard, { flex: 1 }]}>
      {accent ? (
        <LinearGradient
          colors={ACCENT_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statIcon}
        >
          <Ionicons name={icon} size={18} color={colors.white} />
        </LinearGradient>
      ) : (
        <View style={[styles.statIcon, { backgroundColor: colors.glass }]}>
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
      )}
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  date: { color: colors.textFaint, fontSize: 13 },
  greeting: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: fonts.serif,
    marginTop: 4,
  },

  hero: { marginTop: 22, padding: 22, borderRadius: radius["2xl"] },
  heroGlass: {
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  heroKicker: { color: colors.textFaint, fontSize: 12, fontWeight: "600" },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: fonts.serif,
  },
  heroSummary: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  heroLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 14 },
  heroLinkText: { color: colors.accentSoft, fontSize: 14, fontWeight: "700" },

  heroBorder: { marginTop: 22, borderRadius: radius["2xl"], padding: 1.5 },
  heroInner: {
    backgroundColor: "#0b0b12",
    borderRadius: radius["2xl"] - 1,
    padding: 22,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.glassStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  ctaTitle: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700",
    fontFamily: fonts.serif,
    marginTop: 14,
  },
  ctaSub: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },

  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: 22 },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "700" },
  statLabel: { color: colors.textFaint, fontSize: 11, marginTop: 1 },

  trail: {
    marginTop: spacing.md,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  trailLabel: { color: colors.textFaint, fontSize: 12, fontWeight: "600" },
  trailRow: { flexDirection: "row", gap: 8, marginTop: 12 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 34,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: fonts.serif,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText: { color: colors.textMuted, fontSize: 14 },

  empty: {
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    padding: 32,
    alignItems: "center",
  },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
});
