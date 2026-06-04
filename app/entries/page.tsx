"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDiary } from "@/lib/store";
import { EntryCard } from "@/components/entry-card";
import { MOOD_LIST } from "@/lib/moods";
import { cx } from "@/lib/utils";
import { PenIcon } from "@/components/icons";
import type { MoodKey } from "@/lib/types";

export default function EntriesPage() {
  const { entries, ready } = useDiary();
  const [q, setQ] = useState("");
  const [moodFilter, setMoodFilter] = useState<MoodKey | "all">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (moodFilter !== "all" && e.mood !== moodFilter) return false;
      if (!needle) return true;
      return (
        e.title.toLowerCase().includes(needle) ||
        e.summary.toLowerCase().includes(needle) ||
        e.tags.some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [entries, q, moodFilter]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
            일기장
          </h1>
          <p className="mt-1 text-sm text-white/45">
            지금까지 {entries.length}편의 하루가 쌓였어요
          </p>
        </div>
        <Link
          href="/write"
          className="inline-flex items-center gap-2 rounded-2xl gradient-accent px-4 py-2.5 text-sm font-semibold text-white ring-glow transition hover:-translate-y-0.5"
        >
          <PenIcon className="h-4 w-4" /> 새 일기
        </Link>
      </header>

      {/* Search */}
      <div className="glass-strong mb-3 flex items-center gap-3 rounded-2xl px-4 py-3">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-white/35"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목, 내용, 태그로 검색"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
        />
      </div>

      {/* Mood filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          active={moodFilter === "all"}
          onClick={() => setMoodFilter("all")}
        >
          전체
        </FilterChip>
        {MOOD_LIST.map((m) => (
          <FilterChip
            key={m.key}
            active={moodFilter === m.key}
            onClick={() => setMoodFilter(m.key)}
          >
            <span>{m.emoji}</span> {m.label}
          </FilterChip>
        ))}
      </div>

      {/* Grid */}
      {!ready ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-16 text-center">
          <p className="text-sm text-white/55">
            {entries.length === 0
              ? "아직 일기가 없어요. 첫 기록을 남겨보세요."
              : "조건에 맞는 일기가 없어요."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e, i) => (
            <EntryCard key={e.id} entry={e} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
        active
          ? "border-transparent gradient-accent text-white"
          : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}
