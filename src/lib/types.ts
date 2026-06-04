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
  /** two-stop gradient for badges & accents */
  gradient: [string, string];
  /** soft solid tint */
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
  /** yyyy-mm-dd of the day the entry belongs to */
  date: string;
  title: string;
  summary: string;
  mood: MoodKey;
  tags: string[];
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
