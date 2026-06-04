import { moodOf } from "@/lib/moods";
import type { MoodKey } from "@/lib/types";
import { cx } from "@/lib/utils";

export function MoodBadge({
  mood,
  size = "md",
  showLabel = true,
}: {
  mood: MoodKey;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const m = moodOf(mood);
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 font-medium backdrop-blur",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
      )}
    >
      <span aria-hidden>{m.emoji}</span>
      {showLabel && <span className={m.tint}>{m.label}</span>}
    </span>
  );
}

export function MoodDot({ mood }: { mood: MoodKey }) {
  const m = moodOf(mood);
  return (
    <span
      className={cx(
        "inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br",
        m.gradient,
      )}
    />
  );
}
