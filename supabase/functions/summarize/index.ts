// 요약 함수: 대화 전체를 바탕으로 제목/요약/감정을 생성하고 일기를 완성한다.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  adminClient,
  requireUser,
  callGrok,
  type ChatMsg,
} from '../_shared/grok.ts';
import { personaPrompt } from '../_shared/personas.ts';

const MOODS = ['joy', 'calm', 'sad', 'anxious', 'angry', 'tired', 'love', 'grateful'];

const SUMMARY_INSTRUCTION = `위 대화를 바탕으로 사용자의 하루 일기를 작성해줘.
반드시 아래 JSON 형식으로만 답해:
{
  "title": "10자 이내의 감성적인 제목",
  "summary": "사용자 시점(1인칭)으로 쓴 3~5문장의 일기. 대화의 핵심 사건과 감정을 담되 따뜻하게.",
  "mood": "다음 중 하나: ${MOODS.join(', ')}"
}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const { entry_id } = await req.json();
    if (!entry_id) return jsonResponse({ error: 'entry_id is required' }, 400);

    const db = adminClient();

    const { data: entry } = await db
      .from('entries')
      .select('id, user_id, persona')
      .eq('id', entry_id)
      .single();
    if (!entry || entry.user_id !== userId) {
      return jsonResponse({ error: 'not found' }, 404);
    }

    const { data: history } = await db
      .from('messages')
      .select('role, content')
      .eq('entry_id', entry_id)
      .order('created_at', { ascending: true });

    if (!history || history.length === 0) {
      return jsonResponse({ error: 'no conversation to summarize' }, 400);
    }

    const messages: ChatMsg[] = [
      { role: 'system', content: personaPrompt(entry.persona) },
      ...(history as ChatMsg[]),
      { role: 'user', content: SUMMARY_INSTRUCTION },
    ];

    const raw = await callGrok(messages, { json: true, temperature: 0.6 });

    let parsed: { title?: string; summary?: string; mood?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // JSON 파싱 실패 시 폴백
      parsed = { title: '오늘의 일기', summary: raw, mood: 'calm' };
    }

    const mood = MOODS.includes(parsed.mood ?? '') ? parsed.mood : 'calm';
    const title = (parsed.title ?? '오늘의 일기').slice(0, 40);
    const summary = parsed.summary ?? '';

    const { error } = await db
      .from('entries')
      .update({ title, summary, mood, status: 'done' })
      .eq('id', entry_id);
    if (error) throw error;

    return jsonResponse({ title, summary, mood });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('summarize error', e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
