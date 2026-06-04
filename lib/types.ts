export type MoodKey =
  | "radiant"
  | "calm"
  | "neutral"
  | "tired"
  | "down"
  | "anxious";

export interface Mood {
  key: MoodKey;
  label: string;
  emoji: string;
  /** tailwind gradient stops used for badges & accents */
  gradient: string;
  /** soft text tint */
  tint: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface Entry {
  id: string;
  /** ISO date string yyyy-mm-dd of the day the entry belongs to */
  date: string;
  title: string;
  /** the distilled diary text */
  summary: string;
  mood: MoodKey;
  tags: string[];
  /** full conversation that produced the entry */
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
