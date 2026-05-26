import { ChatMessage } from './storage';
import { PERSONAS, PersonaId } from '../constants/personas';

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Send messages to Gemini API with the selected persona's system prompt.
 * Requires EXPO_PUBLIC_GEMINI_API_KEY in environment (.env.local).
 */
export async function sendMessage(
  personaId: PersonaId,
  messages: ChatMessage[]
): Promise<string> {
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    // Demo mode: return a canned response so UI is testable without a key
    await new Promise((r) => setTimeout(r, 800));
    return getDemoReply(persona.id);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: persona.systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.85 },
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

const DIARY_SUMMARY_PROMPT = `당신은 감성적인 일기 작가입니다.
아래 대화 내용을 읽고, 사용자의 감정과 하루를 담은 1인칭 감성 일기로 변환해 주세요.

규칙:
- 반드시 JSON 형식으로만 응답하세요: {"title": "...", "content": "..."}
- title: 오늘의 감정이나 키워드를 담은 짧은 제목 (15자 이내)
- content: 2~4 문단의 감성적인 일기 본문. 대화에서 느낀 감정과 생각을 자연스럽게 녹여주세요.
- 존댓말 사용, 따뜻하고 문학적인 문체로 작성
- 대화 내용 그대로 나열하지 말고, 감정 중심으로 재구성`;

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

export function makeUserMessage(content: string): ChatMessage {
  return { role: 'user', content, timestamp: new Date().toISOString() };
}

export function makeAssistantMessage(content: string): ChatMessage {
  return { role: 'assistant', content, timestamp: new Date().toISOString() };
}

function getDemoReply(personaId: PersonaId): string {
  const replies: Record<PersonaId, string> = {
    bestie: '맞아 맞아! 나도 그런 적 있어 🍑 근데 그래서 어떻게 됐어? 더 얘기해줘~',
    blunt: '그래서 뭐? 그게 그렇게 힘들었어? ...뭐, 좀 힘들었겠다. 근데 넌 괜찮아질 거야.',
    unni: '그랬구나. 그 감정, 충분히 이해해. 나도 비슷한 시간이 있었거든. 지금 어떤 게 제일 마음에 걸려?',
    expert: '말씀해 주신 감정이 잘 느껴지네요. 그 순간에 어떤 생각이 가장 먼저 떠오르셨나요?',
  };
  return replies[personaId] ?? replies.bestie;
}
