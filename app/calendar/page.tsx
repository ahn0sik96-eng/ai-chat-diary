"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDiary } from "@/lib/store";
import { moodOf } from "@/lib/moods";
import { cx, todayISO } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { Entry } from "@/lib/types";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { entries } = useDiary();
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const byDate = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const e of entries) if (!map.has(e.date)) map.set(e.date, e);
    return map;
  }, [entries]);

  const today = todayISO();
  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthEntries = entries.filter((e) =>
    e.date.startsWith(`${view.y}-${String(view.m + 1).padStart(2, "0")}`),
  );

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
            달력
          </h1>
          <p className="mt-1 text-sm text-white/45">
            이번 달 {monthEntries.length}편 기록
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => shift(-1)}
            aria-label="이전 달"
            className="flex h-10 w-10 items-center justify-center rounded-2xl glass text-white/70 transition hover:text-white"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-[7rem] text-center font-display text-lg font-semibold text-white">
            {view.y}.{String(view.m + 1).padStart(2, "0")}
          </div>
          <button
            onClick={() => shift(1)}
            aria-label="다음 달"
            className="flex h-10 w-10 items-center justify-center rounded-2xl glass text-white/70 transition hover:text-white"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="glass-strong rounded-4xl p-4 sm:p-6">
        {/* weekday labels */}
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {WEEK.map((w, i) => (
            <div
              key={w}
              className={cx(
                "py-2 text-center text-xs font-medium",
                i === 0 ? "text-red-300/70" : "text-white/40",
              )}
            >
              {w}
            </div>
          ))}
        </div>

        {/* day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e${idx}`} />;
            const date = iso(view.y, view.m, day);
            const entry = byDate.get(date);
            const isToday = date === today;
            const m = entry ? moodOf(entry.mood) : null;

            const inner = (
              <div
                className={cx(
                  "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl text-sm transition",
                  entry
                    ? "glass hover:glass-strong"
                    : "text-white/35 hover:bg-white/5",
                  isToday && "ring-1 ring-accent/60",
                )}
              >
                <span className={cx(entry ? "text-white/80" : "")}>{day}</span>
                {m ? (
                  <span
                    className={cx(
                      "flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br text-[13px]",
                      m.gradient,
                    )}
                  >
                    {m.emoji}
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                )}
              </div>
            );

            return entry ? (
              <Link key={date} href={`/entries/${entry.id}`}>
                {inner}
              </Link>
            ) : (
              <div key={date}>{inner}</div>
            );
          })}
        </div>
      </div>

      {/* This month list */}
      {monthEntries.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-white">
            이번 달의 기록
          </h2>
          <div className="space-y-2">
            {monthEntries.map((e) => {
              const m = moodOf(e.mood);
              return (
                <Link
                  key={e.id}
                  href={`/entries/${e.id}`}
                  className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:glass-strong"
                >
                  <span
                    className={cx(
                      "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-base",
                      m.gradient,
                    )}
                  >
                    {m.emoji}
                  </span>
                  <span className="w-12 shrink-0 text-sm text-white/45">
                    {e.date.slice(5).replace("-", ".")}
                  </span>
                  <span className="truncate text-sm font-medium text-white">
                    {e.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
