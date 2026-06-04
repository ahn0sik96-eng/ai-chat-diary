"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDiary } from "@/lib/store";
import { ChatBubble, TypingIndicator } from "@/components/chat-bubble";
import { MOOD_LIST } from "@/lib/moods";
import { opener, replyTo, inferMood, distill } from "@/lib/ai";
import { uid, todayISO, cx } from "@/lib/utils";
import { SendIcon, SparkleIcon, CheckIcon } from "@/components/icons";
import type { ChatMessage, MoodKey } from "@/lib/types";

const PROMPTS = [
  "오늘 가장 기억에 남는 순간은?",
  "지금 마음은 어떤 색깔인가요?",
  "스스로에게 해주고 싶은 말이 있다면?",
];

export default function WritePage() {
  const router = useRouter();
  const { saveEntry } = useDiary();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [moodTouched, setMoodTouched] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // seed the opening line once
  useEffect(() => {
    setMessages([
      {
        id: uid("m"),
        role: "assistant",
        content: opener(),
        createdAt: Date.now(),
      },
    ]);
  }, []);

  // autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const canSave = userTurns >= 1;

  function send(text: string) {
    const content = text.trim();
    if (!content || typing) return;

    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      content,
      createdAt: Date.now(),
    };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";

    // auto-infer mood from the running conversation unless user picked one
    if (!moodTouched) setMood(inferMood(nextMsgs));

    setTyping(true);
    const delay = 700 + Math.random() * 700;
    window.setTimeout(() => {
      const reply: ChatMessage = {
        id: uid("m"),
        role: "assistant",
        content: replyTo(content, userTurns),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setTyping(false);
    }, delay);
  }

  function handleSave() {
    if (!canSave) return;
    const finalMood = mood ?? inferMood(messages);
    const { title, summary, tags } = distill(messages);
    const now = Date.now();
    const id = uid("entry");
    saveEntry({
      id,
      date: todayISO(),
      title,
      summary,
      mood: finalMood,
      tags,
      messages,
      createdAt: now,
      updatedAt: now,
    });
    router.push(`/entries/${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  }

  function autoGrow(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-3xl flex-col md:h-[calc(100dvh-7rem)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SparkleIcon className="h-4 w-4 text-accent" />
            <h1 className="font-display text-xl font-semibold text-white">
              Lumi와 대화하기
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-white/45">
            편하게 이야기하면 일기로 정리해드릴게요
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
            canSave
              ? "gradient-accent text-white ring-glow hover:-translate-y-0.5"
              : "cursor-not-allowed bg-white/5 text-white/30",
          )}
        >
          <CheckIcon className="h-4 w-4" /> 일기로 저장
        </button>
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="glass flex-1 space-y-4 overflow-y-auto rounded-4xl p-4 sm:p-5"
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {typing && <TypingIndicator />}
      </div>

      {/* Mood picker */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-xs text-white/40">오늘의 기분</span>
        {MOOD_LIST.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMood(m.key);
              setMoodTouched(true);
            }}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
              mood === m.key
                ? "border-transparent gradient-accent text-white"
                : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10",
            )}
          >
            <span>{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Quick prompts (only before user starts) */}
      {userTurns === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="mt-3">
        <div className="glass-strong flex items-end gap-2 rounded-3xl p-2 pl-4">
          <textarea
            ref={taRef}
            rows={1}
            value={draft}
            onChange={autoGrow}
            onKeyDown={onKeyDown}
            placeholder="오늘 있었던 일을 적어보세요…"
            className="max-h-[140px] flex-1 resize-none bg-transparent py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          <button
            onClick={() => send(draft)}
            disabled={!draft.trim() || typing}
            aria-label="보내기"
            className={cx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition",
              draft.trim() && !typing
                ? "gradient-accent text-white hover:scale-105"
                : "bg-white/5 text-white/30",
            )}
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
