import { DiaryStyle, PersonaId } from '@/types';

/**
 * Offline canned responses used when no API key is set, so the whole app
 * (chat -> summarize -> decorate) is fully testable without xAI access.
 */

const PERSONA_REPLIES: Record<PersonaId, string[]> = {
  caring_friend: [
    '오 그랬구나, 오늘 진짜 고생 많았겠다 🥺 좀 더 얘기해줘.',
    '그 마음 충분히 이해돼. 너 잘못 아니야.',
    '그래도 그 와중에 잘 버텼다 진짜. 지금 기분은 좀 어때?',
  ],
  psychiatrist: [
    '그렇게 느끼셨군요. 그 감정이 언제부터 시작됐는지 기억나세요?',
    '충분히 그럴 수 있어요. 스스로를 너무 몰아세우지 않으셨으면 해요.',
    '오늘 그 순간, 마음속에서 가장 크게 올라온 감정은 어떤 거였을까요?',
  ],
  funny_friend: [
    'ㅋㅋㅋㅋ 야 그건 좀 웃긴데? 그래서 어떻게 됐어',
    '헐 대박 진심? 디테일 다 풀어봐 빨리',
    '아 근데 그건 좀 빡칠 만하다 ㅋㅋ 그래도 넌 잘했어',
  ],
  cool_senior: [
    '그 정도면 충분히 잘한 거야. 너무 자책하지 마.',
    '음, 그럴 땐 한 발 물러서서 보면 좀 달라 보이더라.',
    '오늘은 좀 쉬어. 내일 형이/누나가 또 들어줄게.',
  ],
  warm_parent: [
    '우리 아들/딸 오늘도 애썼다. 밥은 챙겨 먹었어?',
    '괜찮아, 엄마/아빠는 늘 네 편이야. 천천히 말해도 돼.',
    '그런 일이 있었구나. 많이 속상했겠다, 우리 아가.',
  ],
};

const MOCK_SUMMARIES: Record<DiaryStyle, { title: string; mood: string; sentences: string[] }> = {
  normal: {
    title: '평범한 하루',
    mood: '잔잔함',
    sentences: [
      '오늘은 아침부터 마음이 조금 무거웠다.',
      '그래도 해야 할 일들을 하나씩 해냈다.',
      '점심엔 좋아하는 걸 먹어서 잠깐 기분이 풀렸다.',
      '하루를 돌아보니 그럭저럭 괜찮은 날이었다.',
    ],
  },
  emotional: {
    title: '복잡한 마음',
    mood: '먹먹함',
    sentences: [
      '오늘은 이유 모를 서운함이 마음에 맴돌았다.',
      '괜찮은 척했지만 사실은 위로받고 싶었던 것 같다.',
      '그 감정을 모른 척하지 않고 들여다본 하루였다.',
      '내일은 조금 더 나를 다정하게 대해주고 싶다.',
    ],
  },
  poetic: {
    title: '저무는 저녁',
    mood: '여운',
    sentences: [
      '하루가 노을처럼 천천히 저물었다.',
      '마음 한구석엔 아직 식지 않은 온기가 남아 있다.',
      '말하지 못한 감정들이 별처럼 조용히 떠올랐다.',
      '오늘의 나를, 가만히 안아주고 싶은 밤이다.',
    ],
  },
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Streamed mock chat reply (mimics token-by-token streaming). */
export async function mockChatStream(
  personaId: PersonaId,
  onDelta: (chunk: string, full: string) => void,
): Promise<string> {
  const reply = pick(PERSONA_REPLIES[personaId] ?? PERSONA_REPLIES.caring_friend);
  let full = '';
  // stream by grapheme-ish chunks
  const chunks = reply.match(/.{1,2}/gu) ?? [reply];
  for (const c of chunks) {
    await delay(28);
    full += c;
    onDelta(c, full);
  }
  return full;
}

/** Mock diary summary as a JSON string (same shape the real API is asked for). */
export async function mockSummaryJson(style: DiaryStyle): Promise<string> {
  await delay(700);
  return JSON.stringify(MOCK_SUMMARIES[style] ?? MOCK_SUMMARIES.normal);
}
