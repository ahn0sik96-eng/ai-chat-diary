import type { ChatMessage } from "@/lib/types";
import { cx } from "@/lib/utils";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cx(
        "flex animate-rise items-end gap-2.5",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && <Avatar />}
      <div
        className={cx(
          "max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-lg gradient-accent text-white"
            : "rounded-bl-lg glass-strong text-white/90",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

export function Avatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl gradient-accent text-white shadow-lg">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M12 4c.8 2.4 2.4 4 4.8 4.8C14.4 9.6 12.8 11.2 12 13.6 11.2 11.2 9.6 9.6 7.2 8.8 9.6 8 11.2 6.4 12 4Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <Avatar />
      <div className="glass-strong flex items-center gap-1.5 rounded-3xl rounded-bl-lg px-4 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/70"
            style={{
              animation: "typing 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
