import { GROK } from '@/config/grok.config';
import { ChatMessage } from '@/types';
import { grokChat, GrokMessage, hasBackend } from './grokClient';

export interface ExtractedEvent {
  title: string;
  date: string; // YYYY-MM-DD
}

/** Quick pre-filter so we only call the LLM when a message looks date-related. */
const DATE_HINT =
  /(\d{1,2}\s*월\s*\d{1,2}\s*일|\d{1,2}\s*일|\d{1,2}\s*월|내일|모레|글피|오늘|이번\s*주|다음\s*주|담주|주말|요일|시험|마감|약속|미팅|회의|생일|예약|디데이|d-?\d)/i;

export function mentionsDate(text: string): boolean {
  return DATE_HINT.test(text);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function parseEvents(raw: string): ExtractedEvent[] {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) return [];
  try {
    const obj = JSON.parse(candidate.slice(start, end + 1)) as { events?: unknown };
    if (!Array.isArray(obj.events)) return [];
    return obj.events
      .filter(
        (e): e is ExtractedEvent =>
          !!e &&
          typeof (e as ExtractedEvent).title === 'string' &&
          typeof (e as ExtractedEvent).date === 'string' &&
          ISO.test((e as ExtractedEvent).date),
      )
      .map((e) => ({ title: e.title.trim().slice(0, 40), date: e.date }));
  } catch {
    return [];
  }
}

/**
 * Extract concrete dated events/plans from a conversation. Relative phrases
 * ("내일", "다음 주 월요일") are resolved against today's date by the model.
 * Returns [] when there's no backend or nothing is found.
 */
export async function extractEvents(history: ChatMessage[]): Promise<ExtractedEvent[]> {
  if (!(await hasBackend())) return [];

  const conversation = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-20)
    .map((m) => `${m.role === 'user' ? '나' : '상대'}: ${m.content}`)
    .join('\n');

  const messages: GrokMessage[] = [
    {
      role: 'system',
      content: `오늘 날짜는 ${todayStr()}야. 다음 대화에서 '나'(사용자)의 구체적인 일정/약속/이벤트를 뽑아.
- 날짜가 분명한 것만. 상대적 표현(내일, 이번 주 금요일 등)은 오늘 기준 실제 날짜로 변환해.
- 모호하거나 추측인 건 넣지 마.
- 출력은 JSON만: {"events":[{"title":"짧은 제목","date":"YYYY-MM-DD"}]}. 없으면 {"events":[]}.`,
    },
    { role: 'user', content: conversation },
  ];

  try {
    const raw = await grokChat({
      messages,
      model: GROK.summaryModel,
      temperature: 0.2,
      jsonMode: true,
    });
    return parseEvents(raw);
  } catch {
    return [];
  }
}
