import type { ChatMessage, MoodKey } from "./types";

/**
 * Lightweight offline "AI" — a warm journaling companion that picks
 * empathetic, open-ended follow-ups from simple keyword cues.
 * No network / API key required.
 */

const OPENERS = [
  "오늘 하루는 어땠어요? 마음에 남은 순간이 있다면 천천히 들려주세요.",
  "안녕하세요. 지금 이 순간, 어떤 기분인가요?",
  "오늘 하루를 한 문장으로 표현한다면 어떤 말이 떠오르나요?",
];

interface Cue {
  match: RegExp;
  replies: string[];
}

const CUES: Cue[] = [
  {
    match: /(피곤|지쳐|힘들|지친|졸려|번아웃)/,
    replies: [
      "오늘 많이 지쳤군요. 그 피로 안에서도 스스로를 끝까지 다독여준 당신이 대단해요. 무엇이 가장 힘을 빼앗아 갔나요?",
      "충분히 그럴 만한 하루였어요. 지금 가장 필요한 건 무엇일까요?",
    ],
  },
  {
    match: /(행복|기뻐|기쁘|좋았|즐거|설레|신나)/,
    replies: [
      "그 좋은 기운이 여기까지 전해져요. 그 순간을 떠올리면 어떤 장면이 가장 선명한가요?",
      "오늘의 반짝임을 오래 기억하고 싶네요. 무엇이 그렇게 마음을 채워줬나요?",
    ],
  },
  {
    match: /(슬퍼|우울|가라앉|눈물|울었|외로|허전)/,
    replies: [
      "그런 마음이 드는 날, 이렇게 꺼내어 말해줘서 고마워요. 그 감정에 이름을 붙인다면 어떤 단어일까요?",
      "괜찮아요, 가라앉는 날도 하루의 일부예요. 지금 스스로에게 건네고 싶은 말이 있나요?",
    ],
  },
  {
    match: /(불안|걱정|초조|두려|긴장|막막)/,
    replies: [
      "마음이 자꾸 앞서 달려가는 느낌이었겠어요. 그 걱정의 가장 큰 덩어리는 무엇인가요?",
      "불안은 종종 우리가 무언가를 소중히 여긴다는 신호이기도 해요. 지금 가장 지키고 싶은 건 무엇인가요?",
    ],
  },
  {
    match: /(일|회사|프로젝트|마감|업무|야근|회의)/,
    replies: [
      "일 속에서의 하루였군요. 그 안에서 작게라도 뿌듯했던 지점이 있었나요?",
      "오늘의 일은 당신에게 어떤 의미로 남았나요?",
    ],
  },
];

const FALLBACKS = [
  "그랬군요. 조금 더 들려줄 수 있어요? 그때 마음은 어땠어요?",
  "이야기해줘서 고마워요. 그 순간 가장 강하게 느낀 감정은 무엇이었나요?",
  "그 안에서 당신에게 가장 의미 있던 부분은 무엇이었을까요?",
  "충분히 그럴 수 있어요. 오늘의 그 경험이 내일의 당신에게 무엇을 남길까요?",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export function opener(seed = Date.now()): string {
  return pick(OPENERS, seed);
}

/** Randomised "thinking" delay (ms) for the typing indicator. */
export function replyDelay(): number {
  return 700 + Math.random() * 700;
}

export function replyTo(userText: string, turn: number): string {
  const cue = CUES.find((c) => c.match.test(userText));
  const seed = userText.length + turn * 7;
  if (cue) return pick(cue.replies, seed);
  return pick(FALLBACKS, seed);
}

export function inferMood(messages: ChatMessage[]): MoodKey {
  const text = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");
  if (/(행복|기뻐|기쁘|좋았|즐거|설레|신나|벅차|최고)/.test(text)) return "radiant";
  if (/(평온|편안|차분|좋다|만족|충만|여유)/.test(text)) return "calm";
  if (/(불안|걱정|초조|두려|긴장|막막)/.test(text)) return "anxious";
  if (/(슬퍼|우울|가라앉|눈물|울었|외로|허전)/.test(text)) return "down";
  if (/(피곤|지쳐|힘들|지친|졸려|번아웃)/.test(text)) return "tired";
  return "neutral";
}

export function distill(messages: ChatMessage[]): {
  title: string;
  summary: string;
  tags: string[];
} {
  const userTexts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean);
  const summary = userTexts.join(" ");
  const firstLine = userTexts[0] ?? "오늘의 기록";
  const title =
    firstLine.length > 22 ? firstLine.slice(0, 22).trim() + "…" : firstLine;

  const dict = [
    "일", "회사", "프로젝트", "친구", "가족", "사랑", "운동", "여행",
    "카페", "산책", "휴식", "비", "날씨", "음악", "책", "감정",
  ];
  const tags = dict.filter((w) => summary.includes(w)).slice(0, 4);
  return { title, summary, tags: tags.length ? tags : ["일상"] };
}
