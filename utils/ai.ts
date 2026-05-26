import { readAsStringAsync } from 'expo-file-system';
import { ChatMessage } from './storage';
import { PERSONAS, PersonaId } from '../constants/personas';
import { PERSONA_PROMPTS, TASK_PROMPTS } from '../constants/prompts';
import { ProactiveContext, formatContextForPrompt } from './memory';

const GEMINI_MODEL = 'gemini-2.5-flash';

// ─── Core fetch helper ────────────────────────────────────────────────────

async function geminiCall(
  systemPrompt: string,
  userText: string,
  config: { maxTokens: number; temperature: number; json?: boolean }
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return '';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: config.temperature,
      ...(config.json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) return '';
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─── Chat ─────────────────────────────────────────────────────────────────

export async function sendMessage(
  personaId: PersonaId,
  messages: ChatMessage[]
): Promise<string> {
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 800));
    return getDemoReply(persona.id);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const contents = await Promise.all(
    messages.map(async (m) => {
      const parts: Record<string, unknown>[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.imageUri) {
        try {
          const base64 = await readAsStringAsync(m.imageUri, { encoding: 'base64' });
          parts.push({ inline_data: { mime_type: 'image/jpeg', data: base64 } });
        } catch {}
      }
      if (parts.length === 0) parts.push({ text: '' });
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    })
  );

  // Use prompts.ts system prompt if available, fallback to personas.ts
  const systemPrompt =
    PERSONA_PROMPTS[personaId]?.systemPrompt ?? persona.systemPrompt;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 300, temperature: 0.85 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content returned from Gemini API');
  return text;
}

// ─── Diary summarization (with emotion emoji) ─────────────────────────────

export async function summarizeToDiary(
  messages: ChatMessage[]
): Promise<{ title: string; content: string; emotionEmoji: string }> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    const firstMsg = messages.find((m) => m.role === 'user')?.content ?? '오늘 하루';
    return {
      title: firstMsg.slice(0, 15),
      content: `오늘은 ${firstMsg}에 대해 이야기를 나눴다. 마음속 이야기를 꺼내놓으니 한결 가벼워진 느낌이 들었다.`,
      emotionEmoji: '😊',
    };
  }

  const task = TASK_PROMPTS.diary_summary;
  const conversation = messages
    .filter((m) => m.content)
    .map((m) => `${m.role === 'user' ? '나' : 'AI'}: ${m.content}`)
    .join('\n');

  const text = await geminiCall(task.systemPrompt, conversation, {
    maxTokens: task.config.maxTokens,
    temperature: task.config.temperature,
    json: true,
  });

  try {
    const parsed = JSON.parse(text || '{}');
    return {
      title: parsed.title ?? '오늘의 일기',
      content: parsed.content ?? text,
      emotionEmoji: parsed.emotionEmoji ?? '😊',
    };
  } catch {
    return { title: '오늘의 일기', content: text, emotionEmoji: '😊' };
  }
}

// ─── Schedule & reminder extraction ──────────────────────────────────────

export async function extractFromChat(
  messages: ChatMessage[]
): Promise<{
  schedules: { title: string; date: string; time?: string }[];
  reminders: { title: string; datetime: string }[];
}> {
  const empty = { schedules: [], reminders: [] };
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return empty;

  const now = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const systemPrompt = TASK_PROMPTS.schedule_extract.systemPrompt
    .replace('{TODAY}', now.toISOString().slice(0, 10))
    .replace('{DAYOFWEEK}', dayNames[now.getDay()]);

  const conversation = messages
    .filter((m) => m.content)
    .map((m) => `${m.role === 'user' ? '나' : 'AI'}: ${m.content}`)
    .join('\n');

  const task = TASK_PROMPTS.schedule_extract;
  const text = await geminiCall(systemPrompt, conversation, {
    maxTokens: task.config.maxTokens,
    temperature: task.config.temperature,
    json: true,
  });

  try {
    const parsed = JSON.parse(text || '{}');
    return {
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
    };
  } catch {
    return empty;
  }
}

// ─── Proactive opener ─────────────────────────────────────────────────────

export async function generateProactiveOpener(
  personaId: PersonaId,
  context: ProactiveContext
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  if (!apiKey) return getDemoOpener(personaId, context);

  const personaData = PERSONA_PROMPTS[personaId];
  const systemPrompt = TASK_PROMPTS.proactive_opener.systemPrompt
    .replace('{PERSONA_NAME}', personaData?.role ?? persona.name)
    .replace('{CONTEXT_JSON}', formatContextForPrompt(context));

  const task = TASK_PROMPTS.proactive_opener;
  const text = await geminiCall(systemPrompt, '대화를 시작해줘', {
    maxTokens: task.config.maxTokens,
    temperature: task.config.temperature,
  });

  return text.trim() || getDemoOpener(personaId, context);
}

// ─── Message factories ─────────────────────────────────────────────────────

export function makeUserMessage(content: string, imageUri?: string): ChatMessage {
  return { role: 'user', content, timestamp: new Date().toISOString(), imageUri };
}

export function makeAssistantMessage(content: string): ChatMessage {
  return { role: 'assistant', content, timestamp: new Date().toISOString() };
}

// ─── Demo fallbacks ────────────────────────────────────────────────────────

function getDemoReply(personaId: PersonaId): string {
  const replies: Record<PersonaId, string> = {
    bestie: '맞아 맞아! 나도 그런 적 있어~ 근데 그래서 어떻게 됐어? 더 얘기해줘!',
    blunt: '그래서 뭐? 그게 그렇게 힘들었어? ...뭐, 좀 힘들었겠다. 근데 넌 괜찮아질 거야.',
    unni: '그랬구나. 충분히 이해해. 나도 비슷한 시간이 있었거든. 지금 어떤 게 제일 마음에 걸려?',
    expert: '말씀해 주신 감정이 잘 느껴지네요. 그 순간에 어떤 생각이 가장 먼저 떠오르셨나요?',
  };
  return replies[personaId] ?? replies.bestie;
}

function getDemoOpener(personaId: PersonaId, ctx: ProactiveContext): string {
  const openers: Record<PersonaId, string> = {
    bestie: ctx.todaySchedules.length > 0
      ? `오늘 ${ctx.todaySchedules[0].title} 있던데, 잘 다녀왔어?`
      : '오늘 어떤 하루였어? 얘기해봐~',
    blunt: ctx.todaySchedules.length > 0
      ? `오늘 ${ctx.todaySchedules[0].title} 있었잖아. 어땠어?`
      : '오늘 하루 어땠어. 할 말 있으면 해.',
    unni: ctx.todaySchedules.length > 0
      ? `오늘 ${ctx.todaySchedules[0].title} 있었구나. 어떻게 됐어?`
      : '오늘 어떤 하루였어? 나 여기 있어.',
    expert: '오늘 어떤 하루를 보내셨나요?',
  };
  return openers[personaId] ?? openers.bestie;
}
