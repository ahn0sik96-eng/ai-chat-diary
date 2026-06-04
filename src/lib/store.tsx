import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  // hydrate from storage on mount
  useEffect(() => {
    let active = true;
    (async () => {
      let loaded: Entry[] = [];
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Entry[];
          if (Array.isArray(parsed)) loaded = parsed;
          else loaded = buildSeedEntries();
        } else {
          loaded = buildSeedEntries();
        }
      } catch {
        loaded = buildSeedEntries();
      }
      if (active) {
        setEntries(loaded);
        hydrated.current = true;
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // persist after hydration
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});
  }, [entries]);

  const saveEntry = useCallback((entry: Entry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      const next = idx >= 0 ? [...prev] : [entry, ...prev];
      if (idx >= 0) next[idx] = entry;
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
