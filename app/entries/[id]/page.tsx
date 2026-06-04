"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useDiary } from "@/lib/store";
import { ChatBubble } from "@/components/chat-bubble";
import { MoodBadge } from "@/components/mood-badge";
import { moodOf } from "@/lib/moods";
import { formatLongDate, cx } from "@/lib/utils";
import {
  ChevronLeftIcon,
  TrashIcon,
  ChevronRightIcon,
} from "@/components/icons";

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getEntry, deleteEntry, ready } = useDiary();
  const [showChat, setShowChat] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const entry = getEntry(params.id);

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-8 w-32 animate-pulse rounded-xl bg-white/5" />
        <div className="mt-6 h-64 animate-pulse rounded-4xl bg-white/5" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="glass rounded-4xl px-6 py-16">
          <p className="text-sm text-white/55">일기를 찾을 수 없어요.</p>
          <Link
            href="/entries"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
          >
            <ChevronLeftIcon className="h-4 w-4" /> 일기장으로
          </Link>
        </div>
      </div>
    );
  }

  const m = moodOf(entry.mood);

  function handleDelete() {
    deleteEntry(entry!.id);
    router.push("/entries");
  }

  return (
    <article className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <ChevronLeftIcon className="h-4 w-4" /> 뒤로
      </button>

      {/* Hero */}
      <div className="glass-strong relative overflow-hidden rounded-4xl p-6 sm:p-8">
        <div
          className={cx(
            "pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br opacity-20 blur-3xl",
            m.gradient,
          )}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span
              className={cx(
                "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg",
                m.gradient,
              )}
            >
              {m.emoji}
            </span>
            <div>
              <p className="text-sm text-white/55">
                {formatLongDate(entry.date)}
              </p>
              <MoodBadge mood={entry.mood} size="sm" />
            </div>
          </div>

          <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-white">
            {entry.title}
          </h1>

          <p className="mt-4 whitespace-pre-wrap font-display text-[17px] italic leading-loose text-white/80">
            {entry.summary}
          </p>

          {entry.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowChat((v) => !v)}
          className="glass flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-medium text-white/75 transition hover:text-white"
        >
          <span>Lumi와 나눈 대화 ({entry.messages.length})</span>
          <ChevronRightIcon
            className={cx(
              "h-4 w-4 transition-transform",
              showChat && "rotate-90",
            )}
          />
        </button>

        {showChat && (
          <div className="mt-3 space-y-4 rounded-4xl glass p-4 sm:p-5">
            {entry.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-8 flex justify-center">
        {confirming ? (
          <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
            <span className="text-sm text-white/65">정말 삭제할까요?</span>
            <button
              onClick={handleDelete}
              className="rounded-xl bg-red-500/90 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              삭제
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-xl bg-white/5 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-red-400"
          >
            <TrashIcon className="h-4 w-4" /> 이 일기 삭제
          </button>
        )}
      </div>
    </article>
  );
}
