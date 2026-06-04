import type { Mood, MoodKey } from "./types";

export const MOODS: Record<MoodKey, Mood> = {
  radiant: {
    key: "radiant",
    label: "벅참",
    emoji: "🌞",
    gradient: ["#fcd34d", "#fb923c"],
    tint: "#fcd34d",
  },
  calm: {
    key: "calm",
    label: "평온",
    emoji: "🍃",
    gradient: ["#6ee7b7", "#2dd4bf"],
    tint: "#6ee7b7",
  },
  neutral: {
    key: "neutral",
    label: "보통",
    emoji: "☁️",
    gradient: ["#cbd5e1", "#94a3b8"],
    tint: "#cbd5e1",
  },
  tired: {
    key: "tired",
    label: "지침",
    emoji: "🌙",
    gradient: ["#a5b4fc", "#a78bfa"],
    tint: "#a5b4fc",
  },
  down: {
    key: "down",
    label: "가라앉음",
    emoji: "🌧️",
    gradient: ["#7dd3fc", "#60a5fa"],
    tint: "#7dd3fc",
  },
  anxious: {
    key: "anxious",
    label: "불안",
    emoji: "🌫️",
    gradient: ["#f0abfc", "#c084fc"],
    tint: "#f0abfc",
  },
};

export const MOOD_LIST: Mood[] = Object.values(MOODS);

export function moodOf(key: MoodKey): Mood {
  return MOODS[key] ?? MOODS.neutral;
}
