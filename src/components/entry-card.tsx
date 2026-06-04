import { Pressable, Text, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { Entry } from "@/lib/types";
import { moodOf } from "@/lib/moods";
import { relativeDay, formatShortDate } from "@/lib/utils";
import { colors, radius, spacing, fonts } from "@/theme";
import { MoodBadge, MoodTile } from "./mood-badge";

export function EntryCard({ entry }: { entry: Entry }) {
  const router = useRouter();
  const m = moodOf(entry.mood);

  return (
    <Pressable
      onPress={() => router.push(`/entry/${entry.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* mood accent edge */}
      <LinearGradient
        colors={m.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.edge}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MoodTile mood={entry.mood} size={36} />
          <View>
            <Text style={styles.day}>{relativeDay(entry.date)}</Text>
            <Text style={styles.date}>{formatShortDate(entry.date)}</Text>
          </View>
        </View>
        <MoodBadge mood={entry.mood} size="sm" />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {entry.title}
      </Text>
      <Text style={styles.summary} numberOfLines={2}>
        {entry.summary}
      </Text>

      {entry.tags.length > 0 && (
        <View style={styles.tags}>
          {entry.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>#{t}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.borderSoft,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.xl,
    padding: spacing.xl,
    paddingLeft: spacing.xl + 4,
    overflow: "hidden",
  },
  pressed: { backgroundColor: colors.glassStrong, transform: [{ scale: 0.99 }] },
  edge: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  day: { color: colors.text, fontSize: 14, fontWeight: "600" },
  date: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: fonts.serif,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.md },
  tag: {
    backgroundColor: colors.glass,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { color: colors.textFaint, fontSize: 11 },
});
