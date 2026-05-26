import AsyncStorage from '@react-native-async-storage/async-storage';

const DIARY_KEY = 'diary_entries_v1';
const PURCHASED_KEY = 'purchased_items_v1';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PlacedSticker {
  id: string;       // unique per placement
  emoji: string;
  xPct: number;     // 0–100 percent of container width
  yPct: number;     // 0–100 percent of container height
  size: number;
}

export interface DiaryEntry {
  id: string;
  persona_id: string;
  title: string;
  summary?: string;        // AI-generated diary text
  messages: ChatMessage[];
  created_at: string;
  font?: string;
  stickers?: PlacedSticker[];
}

// ── Diary ──────────────────────────────────────────────────────────────────

export async function saveDiaryEntry(
  entry: Omit<DiaryEntry, 'id' | 'created_at'>
): Promise<DiaryEntry> {
  const all = await loadDiaryEntries();
  const newEntry: DiaryEntry = {
    ...entry,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(DIARY_KEY, JSON.stringify([newEntry, ...all]));
  return newEntry;
}

export async function loadDiaryEntries(): Promise<DiaryEntry[]> {
  const raw = await AsyncStorage.getItem(DIARY_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as DiaryEntry[]; } catch { return []; }
}

export async function updateDiaryDecoration(
  id: string,
  patch: { font?: string; stickers?: PlacedSticker[] }
): Promise<void> {
  const all = await loadDiaryEntries();
  const updated = all.map((e) => (e.id === id ? { ...e, ...patch } : e));
  await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(updated));
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const all = await loadDiaryEntries();
  await AsyncStorage.setItem(
    DIARY_KEY,
    JSON.stringify(all.filter((e) => e.id !== id))
  );
}

// ── Purchased items ────────────────────────────────────────────────────────

export async function loadPurchasedIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PURCHASED_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

export async function purchaseItem(id: string): Promise<void> {
  const current = await loadPurchasedIds();
  if (current.includes(id)) return;
  await AsyncStorage.setItem(PURCHASED_KEY, JSON.stringify([...current, id]));
}
