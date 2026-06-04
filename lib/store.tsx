"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Entry } from "./types";
import { buildSeedEntries } from "./mockData";

const STORAGE_KEY = "lumi.entries.v1";

interface DiaryContextValue {
  entries: Entry[];
  ready: boolean;
  getEntry: (id: string) => Entry | undefined;
  saveEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

function loadEntries(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Entry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return buildSeedEntries();
}

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);

  // hydrate from localStorage on mount
  useEffect(() => {
    setEntries(loadEntries());
    setReady(true);
  }, []);

  // persist
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* storage full / unavailable */
    }
  }, [entries, ready]);

  const saveEntry = useCallback((entry: Entry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = entry;
      else next.unshift(entry);
      next.sort((a, b) => b.createdAt - a.createdAt);
      return next;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getEntry = useCallback(
    (id: string) => entries.find((e) => e.id === id),
    [entries],
  );

  const value = useMemo<DiaryContextValue>(
    () => ({ entries, ready, getEntry, saveEntry, deleteEntry }),
    [entries, ready, getEntry, saveEntry, deleteEntry],
  );

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error("useDiary must be used within <DiaryProvider>");
  return ctx;
}
