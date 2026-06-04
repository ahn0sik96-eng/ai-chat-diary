import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const GROK_URL = 'https://api.x.ai/v1/chat/completions';

/** service_role 클라이언트 (RLS 우회 — 검증 후에만 사용). */
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );
}

/** Authorization 헤더의 JWT 로 사용자를 검증해 user.id 를 돌려준다. */
export async function requireUser(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) throw new Response('Unauthorized', { status: 401 });

  const anon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) throw new Response('Unauthorized', { status: 401 });
  return data.user.id;
}

/** Grok(xAI) Chat Completions 호출. options.json=true 면 JSON 응답을 강제. */
export async function callGrok(
  messages: ChatMsg[],
  options: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  const apiKey = Deno.env.get('GROK_API_KEY');
  if (!apiKey) throw new Error('GROK_API_KEY is not configured');
  const model = Deno.env.get('GROK_MODEL') ?? 'grok-3';

  const res = await fetch(GROK_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.8,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Grok API error ${res.status}: ${detail}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}
