import { ChatMessage } from './supabase';
import { PERSONAS, PersonaId } from '../constants/personas';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Send messages to Claude API with the selected persona's system prompt.
 * Requires EXPO_PUBLIC_CLAUDE_API_KEY in environment.
 */
export async function sendMessage(
  personaId: PersonaId,
  messages: ChatMessage[]
): Promise<string> {
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const apiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_CLAUDE_API_KEY is not set');

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: persona.systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('No content returned from Claude API');
  return text;
}

export function makeUserMessage(content: string): ChatMessage {
  return { role: 'user', content, timestamp: new Date().toISOString() };
}

export function makeAssistantMessage(content: string): ChatMessage {
  return { role: 'assistant', content, timestamp: new Date().toISOString() };
}
