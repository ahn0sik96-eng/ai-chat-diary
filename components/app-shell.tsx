"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { cx } from "@/lib/utils";
import {
  HomeIcon,
  PenIcon,
  BookIcon,
  CalendarIcon,
} from "./icons";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV: NavItem[] = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/write", label: "오늘 쓰기", icon: PenIcon },
  { href: "/entries", label: "일기장", icon: BookIcon },
  { href: "/calendar", label: "달력", icon: CalendarIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl gradient-accent ring-glow">
        <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
          <path
            d="M12 4c.8 2.4 2.4 4 4.8 4.8C14.4 9.6 12.8 11.2 12 13.6 11.2 11.2 9.6 9.6 7.2 8.8 9.6 8 11.2 6.4 12 4Z"
            fill="currentColor"
          />
          <circle cx="17.5" cy="16.5" r="1.4" fill="currentColor" opacity=".85" />
          <circle cx="6.8" cy="15.2" r="1" fill="currentColor" opacity=".7" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold tracking-tight text-white">
          Lumi
        </span>
        <span className="mt-0.5 text-[11px] text-white/40">AI 일기장</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl">
      {/* ---- Desktop sidebar ---- */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 px-5 py-7 md:flex">
        <Brand />

        <nav className="flex flex-col gap-1.5">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "glass-strong text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full gradient-accent" />
                )}
                <Icon className={cx("h-5 w-5", active && "text-accent")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="glass rounded-3xl p-4">
            <p className="text-xs leading-relaxed text-white/55">
              매일 한 줄이면 충분해요. 오늘의 마음을 Lumi에게 들려주세요.
            </p>
            <Link
              href="/write"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition hover:gap-2.5"
            >
              지금 기록하기
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ---- Main column ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-background/70 px-5 py-3.5 backdrop-blur-xl md:hidden">
          <Brand />
        </header>

        <main className="flex-1 px-5 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">
          {children}
        </main>
      </div>

      {/* ---- Mobile bottom nav ---- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="mx-auto mb-3 w-[calc(100%-1.5rem)] max-w-md">
          <div className="glass-strong flex items-center justify-around rounded-3xl px-2 py-2 shadow-2xl">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition",
                    active ? "text-white" : "text-white/45",
                  )}
                >
                  <span
                    className={cx(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition",
                      active && "gradient-accent ring-glow text-white",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
