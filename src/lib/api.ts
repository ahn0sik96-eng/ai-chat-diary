import { supabase } from './supabase';
import type { Message } from './types';

/**
 * Edge Function 호출 래퍼.
 * Grok API 키는 함수 쪽 secret 에만 있고, 여기서는 사용자 JWT 만 전달한다.
 */

/** 대화에 사용자 메시지를 추가하고 AI 응답을 받아온다. */
export async function sendChatMessage(
  entryId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { entry_id: entryId, content },
  });
  if (error) throw error;
  return (data as { message: Message }).message;
}

/** 대화 전체를 요약해 제목/요약/감정을 생성하고 일기를 완성한다. */
export async function summarizeEntry(entryId: string): Promise<{
  title: string;
  summary: string;
  mood: string;
}> {
  const { data, error } = await supabase.functions.invoke('summarize', {
    body: { entry_id: entryId },
  });
  if (error) throw error;
  return data as { title: string; summary: string; mood: string };
}
