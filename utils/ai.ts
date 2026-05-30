import { readAsStringAsync } from 'expo-file-system/legacy';
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

// ─── JSON extraction helper ───────────────────────────────────────────────

function stripMarkdown(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  const obj = raw.match(/\{[\s\S]*\}/);
  if (obj) return obj[0];
  return raw.trim();
}

// ─── MIME type helper ─────────────────────────────────────────────────────

function getMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase() ?? '';
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', gif: 'image/gif' } as Record<string, string>)[ext] ?? 'image/jpeg';
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
      if (m.imageUri || m.imageBase64) {
        try {
          const base64 = m.imageBase64 ?? await readAsStringAsync(m.imageUri!, { encoding: 'base64' });
          parts.push({ inline_data: { mime_type: getMimeType(m.imageUri ?? ''), data: base64 } });
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
): Promise<{ title: string; content: string; segments: string[]; emotionEmoji: string }> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    const firstMsg = messages.find((m) => m.role === 'user')?.content ?? '오늘 하루';
    const seg1 = `오늘은 ${firstMsg}에 대해 이야기를 나눴다. 마음속 이야기를 꺼내놓으니 한결 가벼워진 느낌이 들었다.`;
    const seg2 = '생각보다 많은 걸 털어놓았는데, 그게 오히려 좋았다. 가끔은 이렇게 말로 꺼내는 게 필요한 것 같다.';
    const seg3 = '오늘 하루도 나름 잘 버텼다. 내일은 또 어떤 하루가 될지 모르지만, 일단 오늘은 이걸로 충분하다.';
    const demoSegments = [seg1, seg2, seg3];
    return {
      title: firstMsg.slice(0, 15),
      content: demoSegments.join('\n\n'),
      segments: demoSegments,
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
    const parsed = JSON.parse(stripMarkdown(text || '{}'));
    const segments: string[] = Array.isArray(parsed.segments) && parsed.segments.length > 0
      ? parsed.segments
      : (parsed.content ? [parsed.content] : [text]);
    const content = segments.join('\n\n');
    return {
      title: parsed.title ?? '오늘의 일기',
      content,
      segments,
      emotionEmoji: parsed.emotionEmoji ?? '😊',
    };
  } catch {
    return { title: '오늘의 일기', content: text, segments: [text], emotionEmoji: '😊' };
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
    const parsed = JSON.parse(stripMarkdown(text || '{}'));
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

export function makeUserMessage(content: string, imageUri?: string, imageBase64?: string): ChatMessage {
  return { role: 'user', content, timestamp: new Date().toISOString(), imageUri, imageBase64 };
}

export function makeAssistantMessage(content: string): ChatMessage {
  return { role: 'assistant', content, timestamp: new Date().toISOString() };
}

// ─── Demo fallbacks ────────────────────────────────────────────────────────

const DEMO_REPLIES: Record<PersonaId, string[]> = {
  bestie: [
    '맞아 맞아~ 나도 그런 날 있어. 근데 왜 그런 것 같아?',
    '헐 진짜? 좀 더 얘기해봐, 궁금한데!',
    '아 그렇구나... 그래서 지금 기분은 어때?',
    '오 그거 완전 공감돼. 나라면 엄청 힘들었을 것 같아.',
    '잠깐, 그게 무슨 말이야? 자세히 얘기해줘~',
    '에이~ 그 정도면 괜찮은 거 아니야? 아니면 진짜 힘들어?',
    '맞아 맞아! 근데 그래서 지금은 어떻게 하고 싶어?',
    '그거 나도 알아. 진짜 피곤하지. 오늘 좀 쉬었어?',
  ],
  blunt: [
    '그래서 뭐? 그게 그렇게 힘들었어? ...뭐, 좀 힘들었겠다.',
    '근데 솔직히 그건 네가 너무 신경 쓴 거 아니야?',
    '아 그래. 그럼 어떻게 할 건데?',
    '...그렇구나. 뭐 어쩌겠어, 그냥 넘겨야지.',
    '그래봤자 뭐가 달라지는데. 근데 그게 많이 신경 쓰여?',
    '좀 쉬어. 괜히 생각 많이 해봤자 피곤하기만 해.',
  ],
  unni: [
    '그랬구나. 충분히 이해해. 나도 비슷한 시간이 있었거든.',
    '많이 힘들었겠다. 지금 어떤 게 제일 마음에 걸려?',
    '그 감정 당연한 거야. 누구든 그럴 수 있어.',
    '말해줘서 고마워. 혼자 담아두면 더 힘들거든.',
    '나 때도 그랬는데. 지나고 보면 다 지나가더라고. 지금 당장은 어때?',
    '응, 그래. 그런 날이 있어. 오늘 뭐가 제일 힘들었어?',
  ],
  expert: [
    '말씀해 주신 감정이 잘 느껴지네요. 그 순간 어떤 생각이 드셨나요?',
    '그런 감정을 느끼는 건 자연스러운 일이에요. 언제부터 그런 기분이 드셨나요?',
    '충분히 힘드셨겠어요. 지금 가장 필요한 게 뭔지 알 것 같으신가요?',
    '그 상황에서 스스로를 잘 지키고 계신 것 같아요. 어떻게 버티고 계셨나요?',
    '조금 더 이야기해 주실 수 있을까요? 더 잘 이해하고 싶어요.',
  ],
};

function getDemoReply(personaId: PersonaId): string {
  const pool = DEMO_REPLIES[personaId] ?? DEMO_REPLIES.bestie;
  return pool[Math.floor(Math.random() * pool.length)];
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
