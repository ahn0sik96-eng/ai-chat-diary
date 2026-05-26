import { readAsStringAsync } from 'expo-file-system';
import { ChatMessage } from './storage';
import { PERSONAS, PersonaId } from '../constants/personas';

const GEMINI_MODEL = 'gemini-2.5-flash';

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
      if (m.content) {
        parts.push({ text: m.content });
      }
      if (m.imageUri) {
        try {
          const base64 = await readAsStringAsync(m.imageUri, {
            encoding: 'base64',
          });
          parts.push({
            inline_data: { mime_type: 'image/jpeg', data: base64 },
          });
        } catch {}
      }
      if (parts.length === 0) parts.push({ text: '' });
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    })
  );

  const body = {
    system_instruction: { parts: [{ text: persona.systemPrompt }] },
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

const DIARY_SUMMARY_PROMPT = `넌 일기 작성을 도와주는 AI야.
아래 대화 내용을 보고, 사용자 입장에서 쓴 짧은 일기로 만들어줘.

규칙:
- 반드시 JSON 형식으로만 응답: {"title": "...", "content": "..."}
- title: 오늘의 핵심 감정/사건 한 줄 (15자 이내)
- content: 반말로, 3~5문장. 오늘 있었던 일과 느낀 감정을 솔직하고 가볍게. 너무 시적이거나 문학적이지 않게. 진짜 일기 쓰듯이 자연스럽게.
- 예시 톤: "오늘 진짜 별로였다. 그냥 다 귀찮고 아무것도 하기 싫었는데 얘기하니까 좀 나아진 것 같기도 하고."`;

export async function summarizeToDiary(
  messages: ChatMessage[]
): Promise<{ title: string; content: string }> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    const firstMsg = messages.find((m) => m.role === 'user')?.content ?? '오늘 하루';
    return {
      title: firstMsg.slice(0, 15),
      content: `오늘은 ${firstMsg} 에 대해 이야기를 나눴다. 마음속 이야기를 꺼내놓으니 한결 가벼워진 느낌이 들었다.`,
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const conversation = messages
    .filter((m) => m.content)
    .map((m) => `${m.role === 'user' ? '나' : 'AI'}: ${m.content}`)
    .join('\n');

  const body = {
    system_instruction: { parts: [{ text: DIARY_SUMMARY_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: conversation }] }],
    generationConfig: { maxOutputTokens: 1024, temperature: 0.9, responseMimeType: 'application/json' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Gemini API error ${response.status}`);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  try {
    const parsed = JSON.parse(text);
    return {
      title: parsed.title ?? '오늘의 일기',
      content: parsed.content ?? text,
    };
  } catch {
    return { title: '오늘의 일기', content: text };
  }
}

export async function extractFromChat(
  messages: ChatMessage[]
): Promise<{
  schedules: { title: string; date: string; time?: string }[];
  reminders: { title: string; datetime: string }[];
}> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const empty = { schedules: [], reminders: [] };
  if (!apiKey) return empty;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = dayNames[now.getDay()];

  const extractPrompt = `오늘은 ${today} (${dayOfWeek}요일)이야.
대화에서 일정(약속/이벤트)과 할 일(TODO/해야할 것)을 추출해.

규칙:
- JSON으로만 응답
- "내일" = 오늘+1일, "모레" = +2일, "다음주 X요일" = 다음주 해당 요일 등 상대 날짜를 YYYY-MM-DD로 변환
- 시간 정보 없으면 time 생략
- 할 일에 시간 없으면 해당 날짜 09:00으로 설정
- 일정이나 할 일이 없으면 빈 배열

형식: {"schedules":[{"title":"","date":"YYYY-MM-DD","time":"HH:mm"}],"reminders":[{"title":"","datetime":"YYYY-MM-DDTHH:mm:00"}]}`;

  const conversation = messages
    .filter((m) => m.content)
    .map((m) => `${m.role === 'user' ? '나' : 'AI'}: ${m.content}`)
    .join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: extractPrompt }] },
    contents: [{ role: 'user', parts: [{ text: conversation }] }],
    generationConfig: { maxOutputTokens: 512, temperature: 0.2, responseMimeType: 'application/json' },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) return empty;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(text);
    return {
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
    };
  } catch {
    return empty;
  }
}

export function makeUserMessage(content: string, imageUri?: string): ChatMessage {
  return { role: 'user', content, timestamp: new Date().toISOString(), imageUri };
}

export function makeAssistantMessage(content: string): ChatMessage {
  return { role: 'assistant', content, timestamp: new Date().toISOString() };
}

function getDemoReply(personaId: PersonaId): string {
  const replies: Record<PersonaId, string> = {
    bestie: '맞아 맞아! 나도 그런 적 있어~ 근데 그래서 어떻게 됐어? 더 얘기해줘!',
    blunt: '그래서 뭐? 그게 그렇게 힘들었어? ...뭐, 좀 힘들었겠다. 근데 넌 괜찮아질 거야.',
    unni: '그랬구나. 그 감정, 충분히 이해해. 나도 비슷한 시간이 있었거든. 지금 어떤 게 제일 마음에 걸려?',
    expert: '말씀해 주신 감정이 잘 느껴지네요. 그 순간에 어떤 생각이 가장 먼저 떠오르셨나요?',
  };
  return replies[personaId] ?? replies.bestie;
}
