import AsyncStorage from '@react-native-async-storage/async-storage';
import { WritingStyle } from '../constants/prompts';

const SHORT_TERM_KEY = 'memory_short_v1';
const LONG_TERM_KEY = 'memory_long_v1';
const MAX_SHORT_TERM = 7; // 최근 7일 요약 보관

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ShortTermEntry {
  date: string;          // YYYY-MM-DD
  summary: string;       // 한 문장 일기 요약
  emotionEmoji: string;  // 그날 감정 이모지
  topics: string[];      // 주요 키워드
}

export interface LongTermMemory {
  writingStyle: WritingStyle;
  dominantEmotions: string[];    // 최근 자주 나타난 감정 이모지
  recurringTopics: string[];     // 자주 언급되는 주제
  energyPattern: 'morning' | 'evening' | 'irregular';
  summary: string;               // Gemini가 압축한 1~2줄 사용자 소개
  lastCompressed: string;        // ISO
}

// ─── Short-term memory ─────────────────────────────────────────────────────

export async function loadShortTermMemory(): Promise<ShortTermEntry[]> {
  const raw = await AsyncStorage.getItem(SHORT_TERM_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as ShortTermEntry[]; } catch { return []; }
}

export async function addShortTermEntry(entry: ShortTermEntry): Promise<void> {
  const all = await loadShortTermMemory();
  // 같은 날짜면 덮어쓰기
  const filtered = all.filter((e) => e.date !== entry.date);
  const updated = [entry, ...filtered].slice(0, MAX_SHORT_TERM);
  await AsyncStorage.setItem(SHORT_TERM_KEY, JSON.stringify(updated));
}

// ─── Long-term memory ──────────────────────────────────────────────────────

export async function loadLongTermMemory(): Promise<LongTermMemory | null> {
  const raw = await AsyncStorage.getItem(LONG_TERM_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LongTermMemory; } catch { return null; }
}

export async function saveLongTermMemory(memory: LongTermMemory): Promise<void> {
  await AsyncStorage.setItem(LONG_TERM_KEY, JSON.stringify(memory));
}

// ─── Context builder for proactive opener ─────────────────────────────────

export interface ProactiveContext {
  todaySchedules: { title: string; time?: string }[];
  recentMood: string;       // 최근 이모지
  recentTopics: string[];
  userSummary: string;
  dayOfWeek: string;
  todayDate: string;
}

export async function buildProactiveContext(
  todaySchedules: { title: string; time?: string }[]
): Promise<ProactiveContext> {
  const [shortTerm, longTerm] = await Promise.all([
    loadShortTermMemory(),
    loadLongTermMemory(),
  ]);

  const now = new Date();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const recentEmojis = shortTerm.slice(0, 3).map((e) => e.emotionEmoji).filter(Boolean);

  return {
    todaySchedules,
    recentMood: recentEmojis[0] ?? '😊',
    recentTopics: longTerm?.recurringTopics ?? shortTerm.flatMap((e) => e.topics).slice(0, 3),
    userSummary: longTerm?.summary ?? '',
    dayOfWeek: dayNames[now.getDay()],
    todayDate: now.toISOString().slice(0, 10),
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

export function formatContextForPrompt(ctx: ProactiveContext): string {
  const parts: string[] = [];

  parts.push(`오늘: ${ctx.todayDate} (${ctx.dayOfWeek})`);

  if (ctx.todaySchedules.length > 0) {
    const scheduleStr = ctx.todaySchedules
      .map((s) => `${s.time ? s.time + ' ' : ''}${s.title}`)
      .join(', ');
    parts.push(`오늘 일정: ${scheduleStr}`);
  }

  if (ctx.recentMood) {
    parts.push(`최근 감정: ${ctx.recentMood}`);
  }

  if (ctx.recentTopics.length > 0) {
    parts.push(`자주 나온 주제: ${ctx.recentTopics.join(', ')}`);
  }

  if (ctx.userSummary) {
    parts.push(`사용자 특징: ${ctx.userSummary}`);
  }

  return parts.join('\n');
}
