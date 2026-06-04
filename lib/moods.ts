import type { Mood, MoodKey } from "./types";

export const MOODS: Record<MoodKey, Mood> = {
  radiant: {
    key: "radiant",
    label: "벅참",
    emoji: "🌞",
    gradient: "from-amber-300 to-orange-400",
    tint: "text-amber-300",
  },
  calm: {
    key: "calm",
    label: "평온",
    emoji: "🍃",
    gradient: "from-emerald-300 to-teal-400",
    tint: "text-emerald-300",
  },
  neutral: {
    key: "neutral",
    label: "보통",
    emoji: "☁️",
    gradient: "from-slate-300 to-slate-400",
    tint: "text-slate-300",
  },
  tired: {
    key: "tired",
    label: "지침",
    emoji: "🌙",
    gradient: "from-indigo-300 to-violet-400",
    tint: "text-indigo-300",
  },
  down: {
    key: "down",
    label: "가라앉음",
    emoji: "🌧️",
    gradient: "from-sky-300 to-blue-400",
    tint: "text-sky-300",
  },
  anxious: {
    key: "anxious",
    label: "불안",
    emoji: "🌫️",
    gradient: "from-fuchsia-300 to-purple-400",
    tint: "text-fuchsia-300",
  },
};

export const MOOD_LIST: Mood[] = Object.values(MOODS);

export function moodOf(key: MoodKey): Mood {
  return MOODS[key] ?? MOODS.neutral;
}
