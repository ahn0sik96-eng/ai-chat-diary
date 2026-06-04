"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDiary } from "@/lib/store";
import { EntryCard } from "@/components/entry-card";
import { MoodBadge } from "@/components/mood-badge";
import { moodOf } from "@/lib/moods";
import {
  timeOfDayGreeting,
  formatLongDate,
  todayISO,
  cx,
} from "@/lib/utils";
import { PenIcon, FlameIcon, BookIcon, SparkleIcon, ArrowRightIcon } from "@/components/icons";
import type { Entry, MoodKey } from "@/lib/types";

function computeStreak(entries: Entry[]): number {
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // allow today to be empty without breaking the streak
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function dominantMood(entries: Entry[]): MoodKey | null {
  if (!entries.length) return null;
  const counts = new Map<MoodKey, number>();
  for (const e of entries) counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-3xl px-4 py-4">
      <span
        className={cx(
          "flex h-10 w-10 items-center justify-center rounded-2xl",
          accent ? "gradient-accent text-white" : "bg-white/5 text-accent",
        )}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-xl font-semibold text-white">{value}</p>
        <p className="text-[11px] text-white/45">{label}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { entries, ready } = useDiary();

  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);
  const recent = entries.slice(0, 6);

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const monthCount = useMemo(() => {
    const ym = today.slice(0, 7);
    return entries.filter((e) => e.date.startsWith(ym)).length;
  }, [entries, today]);
  const mood = useMemo(() => dominantMood(entries), [entries]);
  const moodTrail = entries.slice(0, 7).reverse();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Greeting */}
      <header className="animate-fade">
        <p className="text-sm text-white/45">{formatLongDate(today)}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {timeOfDayGreeting()}
        </h1>
      </header>

      {/* Hero / today card */}
      <section className="mt-6 animate-rise">
        {todayEntry ? (
          <div className="glass-strong relative overflow-hidden rounded-4xl p-6 sm:p-8">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-white/45">
                    오늘의 기록
                  </span>
                  <MoodBadge mood={todayEntry.mood} size="sm" />
                </div>
                <h2 className="truncate font-display text-2xl font-semibold text-white">
                  {todayEntry.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/55">
                  {todayEntry.summary}
                </p>
              </div>
              <Link
                href={`/entries/${todayEntry.id}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                다시 보기 <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/write"
            className="group relative block overflow-hidden rounded-4xl gradient-accent p-[1.5px] ring-glow transition hover:-translate-y-0.5"
          >
            <div className="relative overflow-hidden rounded-4xl bg-background/85 p-6 backdrop-blur sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl animate-float" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-md">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/70">
                    <SparkleIcon className="h-3.5 w-3.5" /> 아직 오늘을 기록하지 않았어요
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
                    오늘의 마음을
                    <br />
                    <span className="gradient-text">Lumi</span>에게 들려주세요
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    가볍게 대화하다 보면 어느새 하루가 한 편의 일기로 정리돼요.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-2xl gradient-accent px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition group-hover:gap-3">
                  <PenIcon className="h-4 w-4" /> 오늘 일기 쓰기
                </span>
              </div>
            </div>
          </Link>
        )}
      </section>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          accent
          icon={<FlameIcon className="h-5 w-5" />}
          value={`${streak}일`}
          label="연속 기록"
        />
        <StatCard
          icon={<BookIcon className="h-5 w-5" />}
          value={`${monthCount}편`}
          label="이번 달 일기"
        />
        <div className="col-span-2 sm:col-span-1">
          <div className="glass flex items-center gap-3 rounded-3xl px-4 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-lg">
              {mood ? moodOf(mood).emoji : "✨"}
            </span>
            <div className="leading-tight">
              <p className="text-base font-semibold text-white">
                {mood ? moodOf(mood).label : "기록 없음"}
              </p>
              <p className="text-[11px] text-white/45">요즘의 기분</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mood trail */}
      {moodTrail.length > 0 && (
        <section className="mt-5">
          <div className="glass flex items-center gap-3 overflow-x-auto rounded-3xl px-5 py-4">
            <span className="shrink-0 text-xs font-medium text-white/45">
              감정의 흐름
            </span>
            <div className="flex items-end gap-2">
              {moodTrail.map((e) => {
                const m = moodOf(e.mood);
                return (
                  <Link
                    key={e.id}
                    href={`/entries/${e.id}`}
                    title={`${e.date} · ${m.label}`}
                    className={cx(
                      "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-sm transition hover:scale-110",
                      m.gradient,
                    )}
                  >
                    {m.emoji}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent entries */}
      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold text-white">
            최근 일기
          </h2>
          <Link
            href="/entries"
            className="flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
          >
            전체 보기 <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {!ready ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-3xl bg-white/5"
              />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="glass rounded-3xl px-6 py-12 text-center">
            <p className="text-sm text-white/55">
              아직 일기가 없어요. 첫 번째 하루를 기록해볼까요?
            </p>
            <Link
              href="/write"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl gradient-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              <PenIcon className="h-4 w-4" /> 시작하기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map((e, i) => (
              <EntryCard key={e.id} entry={e} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
