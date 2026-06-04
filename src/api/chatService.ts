import { GROK } from '@/config/grok.config';
import { getPersona } from '@/config/personas';
import { ChatMessage, PersonaId } from '@/types';
import { grokChatStream, GrokMessage, hasApiKey } from './grokClient';
import { mockChatStream } from './mock/mockGrok';

/**
 * Sends the conversation to Grok with the persona system prompt injected.
 * Falls back to a mock stream when no API key is configured.
 */
export async function streamPersonaReply(params: {
  personaId: PersonaId;
  history: ChatMessage[];
  onDelta: (chunk: string, full: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { personaId, history, onDelta, signal } = params;

  if (!(await hasApiKey())) {
    return mockChatStream(personaId, onDelta);
  }

  const persona = getPersona(personaId);
  const trimmed = history.slice(-GROK.maxHistoryMessages);

  const messages: GrokMessage[] = [
    { role: 'system', content: persona.systemPrompt },
    ...trimmed
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  return grokChatStream(
    {
      messages,
      temperature: GROK.chatTemperature,
      reasoningEffort: GROK.chatReasoningEffort,
      signal,
    },
    onDelta,
  );
}
