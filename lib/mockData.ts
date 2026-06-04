import type { Entry } from "./types";

/** Build a yyyy-mm-dd string for `n` days before the given base date. */
function daysAgo(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Seed entries are generated relative to "today" so the timeline always feels live. */
export function buildSeedEntries(now = new Date()): Entry[] {
  const t = now.getTime();
  return [
    {
      id: "seed-1",
      date: daysAgo(now, 1),
      title: "비 오는 날의 작은 위로",
      summary:
        "퇴근길에 갑자기 비가 쏟아졌다. 우산이 없어 당황했지만, 카페 처마 밑에서 잠깐 멈춰 선 시간이 의외로 좋았다. 빗소리를 들으며 따뜻한 라떼 한 잔. 바쁘게만 달리던 하루에 쉼표가 찍힌 기분이었다.",
      mood: "calm",
      tags: ["퇴근길", "비", "카페", "쉼"],
      createdAt: t - 86400000,
      updatedAt: t - 86400000,
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "오늘 하루는 어땠어요? 마음에 남은 순간이 있다면 들려주세요.",
          createdAt: t - 86400000 - 5000,
        },
        {
          id: "m2",
          role: "user",
          content:
            "퇴근하는데 비가 엄청 와서 카페 처마 밑에서 비 그칠 때까지 기다렸어. 근데 그 시간이 좀 좋더라.",
          createdAt: t - 86400000 - 4000,
        },
        {
          id: "m3",
          role: "assistant",
          content:
            "예상치 못한 비가 오히려 잠깐의 쉼을 선물해줬네요. 빗소리를 들으며 멈춰 선 그 순간, 어떤 기분이 가장 크게 들었어요?",
          createdAt: t - 86400000 - 3000,
        },
      ],
    },
    {
      id: "seed-2",
      date: daysAgo(now, 3),
      title: "프로젝트 마감, 드디어",
      summary:
        "3주 동안 붙잡고 있던 프로젝트를 마침내 끝냈다. 마지막 커밋을 올리는 순간 어깨에서 큰 짐이 내려가는 느낌. 팀원들과 짧게 자축했고, 오늘만큼은 일 생각 없이 푹 쉬기로 했다.",
      mood: "radiant",
      tags: ["일", "성취", "마감"],
      createdAt: t - 3 * 86400000,
      updatedAt: t - 3 * 86400000,
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "오늘 가장 기억에 남는 일은 무엇이었나요?",
          createdAt: t - 3 * 86400000,
        },
        {
          id: "m2",
          role: "user",
          content: "드디어 그 프로젝트 끝냈어!! 진짜 후련하다.",
          createdAt: t - 3 * 86400000 + 1000,
        },
      ],
    },
    {
      id: "seed-3",
      date: daysAgo(now, 6),
      title: "괜히 마음이 무거운 밤",
      summary:
        "특별한 일은 없었는데 하루 종일 마음이 가라앉았다. 이유를 찾으려 애쓰기보다 그냥 그런 날도 있다고 인정해주기로 했다. 따뜻한 차를 마시고 일찍 잠들기로.",
      mood: "down",
      tags: ["감정", "휴식"],
      createdAt: t - 6 * 86400000,
      updatedAt: t - 6 * 86400000,
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "지금 마음은 어떤가요? 무엇이든 편하게 이야기해도 괜찮아요.",
          createdAt: t - 6 * 86400000,
        },
        {
          id: "m2",
          role: "user",
          content: "딱히 이유는 없는데 그냥 좀 가라앉아. 무기력한 느낌.",
          createdAt: t - 6 * 86400000 + 1000,
        },
      ],
    },
    {
      id: "seed-4",
      date: daysAgo(now, 9),
      title: "오랜만의 산책",
      summary:
        "주말 아침, 알람 없이 일어나 동네를 천천히 걸었다. 햇살이 좋아서 벤치에 앉아 한참을 멍하니 있었다. 아무것도 하지 않는 시간이 이렇게 충만할 수 있다니.",
      mood: "calm",
      tags: ["주말", "산책", "햇살"],
      createdAt: t - 9 * 86400000,
      updatedAt: t - 9 * 86400000,
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "주말은 어떻게 보내고 있어요?",
          createdAt: t - 9 * 86400000,
        },
      ],
    },
  ];
}
