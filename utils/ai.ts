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
