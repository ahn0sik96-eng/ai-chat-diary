import { GROK } from '@/config/grok.config';
import { buildSummaryPrompt } from '@/config/diaryStyles';
import { ChatMessage, DiarySentence, DiaryStyle } from '@/types';
import { uid } from '@/utils/id';
import { grokChat, GrokMessage, hasBackend } from './grokClient';
import { mockSummaryJson } from './mock/mockGrok';

export interface SummaryResult {
  title: string;
  mood?: string;
  sentences: DiarySentence[];
  rawSummary: string;
}

/** Turn a conversation into a sentence-split diary in the requested style. */
export async function summarizeConversation(
  style: DiaryStyle,
  history: ChatMessage[],
): Promise<SummaryResult> {
  const conversationText = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? '나' : '상대'}: ${m.content}`)
    .join('\n');

  let rawResponse: string;
  if (!(await hasBackend())) {
    rawResponse = await mockSummaryJson(style);
  } else {
    const messages: GrokMessage[] = [
      { role: 'system', content: buildSummaryPrompt(style) },
      { role: 'user', content: `다음은 오늘 나눈 대화야:\n\n${conversationText}` },
    ];
    rawResponse = await grokChat({
      messages,
      model: GROK.summaryModel,
      temperature: GROK.summaryTemperature,
      jsonMode: true,
    });
  }

  return parseSummary(rawResponse);
}

/** Extract the first JSON object from a possibly-noisy model response. */
function extractJson(text: string): unknown | null {
  // Strip ```json fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Korean-aware sentence splitter used as a fallback. */
function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split(/(?<=[.!?…。])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function toSentences(texts: string[]): DiarySentence[] {
  return texts
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((text, order) => ({ id: uid(), text, order }));
}

/**
 * Defensive parser: tries structured JSON first, then falls back to splitting raw
 * text on sentence boundaries. Never throws — the decorate flow must not break.
 */
export function parseSummary(raw: string): SummaryResult {
  const parsed = extractJson(raw) as
    | { title?: string; mood?: string; sentences?: unknown }
    | null;

  if (parsed && Array.isArray(parsed.sentences) && parsed.sentences.length > 0) {
    const texts = parsed.sentences.filter((s): s is string => typeof s === 'string');
    if (texts.length > 0) {
      return {
        title: typeof parsed.title === 'string' && parsed.title ? parsed.title : '오늘의 일기',
        mood: typeof parsed.mood === 'string' ? parsed.mood : undefined,
        sentences: toSentences(texts),
        rawSummary: texts.join(' '),
      };
    }
  }

  // Fallback: treat the whole response as prose and split it.
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const texts = splitIntoSentences(cleaned);
  return {
    title: '오늘의 일기',
    sentences: toSentences(texts.length > 0 ? texts : [cleaned || '오늘 하루를 기록했어요.']),
    rawSummary: cleaned,
  };
}
