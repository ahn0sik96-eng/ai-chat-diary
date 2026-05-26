import AsyncStorage from '@react-native-async-storage/async-storage';

const DIARY_KEY = 'diary_entries_v1';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DiaryEntry {
  id: string;
  persona_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
}

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
  try {
    return JSON.parse(raw) as DiaryEntry[];
  } catch {
    return [];
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const all = await loadDiaryEntries();
  await AsyncStorage.setItem(
    DIARY_KEY,
    JSON.stringify(all.filter((e) => e.id !== id))
  );
}
