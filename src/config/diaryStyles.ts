import { DiaryStyle } from '@/types';

/**
 * ── 일기 요약 스타일 프롬프트 ────────────────────────────────────────────────
 * 대화를 사람이 직접 쓴 듯한 일기로 요약합니다.
 * 출력은 반드시 문장 단위로 쪼개져야 해요(꾸미기 캔버스에서 문장별로 배치하기 때문).
 */

export interface DiaryStyleConfig {
  id: DiaryStyle;
  displayName: string;
  emoji: string;
  description: string;
  /** Style-specific instruction appended to the shared summarization prompt. */
  styleInstruction: string;
}

/** Shared rules for every summary style. */
export const SUMMARY_BASE_RULES = `너는 사람이 직접 쓴 것 같은 자연스러운 일기를 만드는 작가야.
아래 대화는 사용자가 오늘 하루를 친구에게 털어놓은 내용이야. 이걸 사용자 본인의 1인칭 일기로 요약해.

[규칙]
- 절대 AI 티 내지 마. "오늘 사용자는~" 같은 3인칭 금지. 반드시 "나는~", "오늘은~" 1인칭.
- 대화에 없는 사실을 지어내지 마. 있었던 일과 감정만 써.
- 너무 길지 않게. 보통 4~8문장.
- 한 문장은 하나의 장면/생각/감정만 담아서 짧게 끊어. (꾸미기에서 문장별로 배치하니까)
- AI가 정리한 느낌(불릿, 번호, "결론적으로") 금지. 진짜 일기처럼.

[출력 형식 — 반드시 이 JSON 만 출력. 다른 말 붙이지 마]
{
  "title": "짧은 제목 (10자 내외)",
  "mood": "오늘 기분을 한 단어로",
  "sentences": ["문장1", "문장2", "문장3"]
}`;

export const DIARY_STYLES: Record<DiaryStyle, DiaryStyleConfig> = {
  normal: {
    id: 'normal',
    displayName: '일반 일기',
    emoji: '📓',
    description: '있었던 일을 담담하게',
    styleInstruction: `[스타일: 일반 일기]
오늘 있었던 일과 그때 느낀 점을 담담하고 솔직하게 적어. 일상 기록하듯 편안한 말투로.`,
  },
  emotional: {
    id: 'emotional',
    displayName: '감정 일기',
    emoji: '💗',
    description: '내 마음에 집중해서',
    styleInstruction: `[스타일: 감정 일기]
사건보다 '내가 어떻게 느꼈는지'에 집중해. 감정의 결과 변화를 솔직하게 들여다보며 적어.
왜 그렇게 느꼈는지, 마음이 어땠는지 부드럽게 풀어.`,
  },
  poetic: {
    id: 'poetic',
    displayName: '시적 일기',
    emoji: '🌙',
    description: '감성적인 문장으로',
    styleInstruction: `[스타일: 시적 일기]
하루를 감성적이고 서정적인 문장으로 표현해. 은유와 이미지를 살짝 써서 시처럼.
과하지 않게, 짧고 여운 있는 문장으로. 그래도 1인칭 일기라는 건 유지해.`,
  },
};

export function buildSummaryPrompt(style: DiaryStyle): string {
  return `${SUMMARY_BASE_RULES}\n\n${DIARY_STYLES[style].styleInstruction}`;
}

export const DIARY_STYLE_LIST: DiaryStyleConfig[] = Object.values(DIARY_STYLES);
