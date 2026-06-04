import { Text, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { moodOf } from "@/lib/moods";
import type { MoodKey } from "@/lib/types";
import { colors, radius } from "@/theme";

export function MoodBadge({
  mood,
  size = "md",
}: {
  mood: MoodKey;
  size?: "sm" | "md";
}) {
  const m = moodOf(mood);
  const sm = size === "sm";
  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: sm ? 10 : 12,
          paddingVertical: sm ? 4 : 6,
        },
      ]}
    >
      <Text style={{ fontSize: sm ? 11 : 13 }}>{m.emoji}</Text>
      <Text style={[styles.label, { color: m.tint, fontSize: sm ? 11 : 12 }]}>
        {m.label}
      </Text>
    </View>
  );
}

/** Square gradient tile showing a mood emoji. */
export function MoodTile({ mood, size = 36 }: { mood: MoodKey; size?: number }) {
  const m = moodOf(mood);
  return (
    <LinearGradient
      colors={m.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.46 }}>{m.emoji}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
  },
  label: { fontWeight: "600" },
});
