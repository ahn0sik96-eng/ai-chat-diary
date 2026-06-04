import Link from "next/link";
import type { Entry } from "@/lib/types";
import { moodOf } from "@/lib/moods";
import { relativeDay, formatShortDate, cx } from "@/lib/utils";
import { MoodBadge } from "./mood-badge";

export function EntryCard({ entry, index = 0 }: { entry: Entry; index?: number }) {
  const m = moodOf(entry.mood);
  return (
    <Link
      href={`/entries/${entry.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
      className="group relative block animate-rise overflow-hidden rounded-3xl glass p-5 transition duration-300 hover:-translate-y-0.5 hover:glass-strong"
    >
      {/* mood accent edge */}
      <span
        className={cx(
          "absolute inset-y-0 left-0 w-1 bg-gradient-to-b opacity-80",
          m.gradient,
        )}
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cx(
              "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-base shadow-lg",
              m.gradient,
            )}
          >
            {m.emoji}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">
              {relativeDay(entry.date)}
            </p>
            <p className="text-[11px] text-white/40">
              {formatShortDate(entry.date)}
            </p>
          </div>
        </div>
        <MoodBadge mood={entry.mood} size="sm" />
      </div>

      <h3 className="font-display text-lg font-semibold leading-snug text-white">
        {entry.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/55">
        {entry.summary}
      </p>

      {entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/45"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100" />
    </Link>
  );
}
