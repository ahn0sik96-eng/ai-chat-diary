import AsyncStorage from '@react-native-async-storage/async-storage';

const DIARY_KEY = 'diary_entries_v1';
const PURCHASED_KEY = 'purchased_items_v1';
const SCHEDULES_KEY = 'schedule_events_v1';
const REMINDERS_KEY = 'reminders_v1';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUri?: string;
  imageBase64?: string;  // transient: used only in memory, stripped before saving
}

export interface PlacedSticker {
  id: string;
  emoji: string;
  xPct: number;
  yPct: number;
  size: number;
  imageUri?: string;  // for photo stickers (background-removed PNG)
}

export interface DiaryEntry {
  id: string;
  persona_id: string;
  title: string;
  summary?: string;
  emotionEmoji?: string;
  messages: ChatMessage[];
  created_at: string;
  font?: string;
  stickers?: PlacedSticker[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  sourceDiaryId?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  datetime: string;
  completed: boolean;
  sourceDiaryId?: string;
  notificationId?: string;
  createdAt: string;
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

// ── Schedules ──────────────────────────────────────────────────────────────

export async function loadSchedules(): Promise<ScheduleEvent[]> {
  const raw = await AsyncStorage.getItem(SCHEDULES_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as ScheduleEvent[]; } catch { return []; }
}

export async function saveSchedule(
  event: Omit<ScheduleEvent, 'id' | 'createdAt'>
): Promise<ScheduleEvent> {
  const all = await loadSchedules();
  const newEvent: ScheduleEvent = {
    ...event,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify([newEvent, ...all]));
  return newEvent;
}

export async function deleteSchedule(id: string): Promise<void> {
  const all = await loadSchedules();
  await AsyncStorage.setItem(
    SCHEDULES_KEY,
    JSON.stringify(all.filter((e) => e.id !== id))
  );
}

// ── Reminders ──────────────────────────────────────────────────────────────

export async function loadReminders(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(REMINDERS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Reminder[]; } catch { return []; }
}

export async function saveReminder(
  reminder: Omit<Reminder, 'id' | 'createdAt'>
): Promise<Reminder> {
  const all = await loadReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify([newReminder, ...all]));
  return newReminder;
}

export async function toggleReminder(id: string): Promise<void> {
  const all = await loadReminders();
  const updated = all.map((r) =>
    r.id === id ? { ...r, completed: !r.completed } : r
  );
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

export async function deleteReminder(id: string): Promise<void> {
  const all = await loadReminders();
  await AsyncStorage.setItem(
    REMINDERS_KEY,
    JSON.stringify(all.filter((r) => r.id !== id))
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
