import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Types ──────────────────────────────────────────────────────────────────

export interface DiaryEntry {
  id: string;
  user_id: string;
  persona_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface StoreItem {
  id: string;
  type: 'font' | 'sticker';
  name: string;
  preview_url: string;
  price: number;
  is_purchased: boolean;
}

// ── Diary ──────────────────────────────────────────────────────────────────

export async function saveDiaryEntry(
  entry: Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('diary_entries')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data as DiaryEntry;
}

export async function fetchDiaryEntries(userId: string): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DiaryEntry[];
}

export async function deleteDiaryEntry(id: string) {
  const { error } = await supabase.from('diary_entries').delete().eq('id', id);
  if (error) throw error;
}
