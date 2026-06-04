// 대화 응답 함수: 사용자 메시지를 저장하고 Grok 의 답장을 만들어 저장·반환한다.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  adminClient,
  requireUser,
  callGrok,
  type ChatMsg,
} from '../_shared/grok.ts';
import { personaPrompt } from '../_shared/personas.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const { entry_id, content } = await req.json();
    if (!entry_id || !content?.trim()) {
      return jsonResponse({ error: 'entry_id and content are required' }, 400);
    }

    const db = adminClient();

    // 소유권 확인
    const { data: entry } = await db
      .from('entries')
      .select('id, user_id, persona')
      .eq('id', entry_id)
      .single();
    if (!entry || entry.user_id !== userId) {
      return jsonResponse({ error: 'not found' }, 404);
    }

    // 사용자 메시지 저장
    await db.from('messages').insert({
      entry_id,
      user_id: userId,
      role: 'user',
      content: content.trim(),
    });

    // 대화 맥락 구성
    const { data: history } = await db
      .from('messages')
      .select('role, content')
      .eq('entry_id', entry_id)
      .order('created_at', { ascending: true });

    const messages: ChatMsg[] = [
      { role: 'system', content: personaPrompt(entry.persona) },
      ...((history ?? []) as ChatMsg[]),
    ];

    const reply = await callGrok(messages, { temperature: 0.85 });

    // 답장 저장
    const { data: saved, error } = await db
      .from('messages')
      .insert({
        entry_id,
        user_id: userId,
        role: 'assistant',
        content: reply,
      })
      .select('*')
      .single();
    if (error) throw error;

    return jsonResponse({ message: saved });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('chat error', e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
