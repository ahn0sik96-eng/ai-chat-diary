export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "6월 3일 화요일" */
export function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;
}

/** "6.3" compact */
export function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/** relative-ish label: 오늘 / 어제 / N일 전 / date */
export function relativeDay(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff > 1 && diff < 7) return `${diff}일 전`;
  return formatLongDate(iso);
}

export function timeOfDayGreeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "고요한 새벽이에요";
  if (h < 12) return "좋은 아침이에요";
  if (h < 17) return "나른한 오후예요";
  if (h < 21) return "하루를 마무리할 시간이에요";
  return "포근한 밤이에요";
}
