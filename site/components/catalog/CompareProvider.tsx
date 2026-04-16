"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "opencatalog-compare-v2";

export type CompareEntry = { slug: string; name: string };

type CompareContextValue = {
  entries: CompareEntry[];
  slugs: string[];
  add: (entry: CompareEntry) => boolean;
  remove: (slug: string) => void;
  toggle: (entry: CompareEntry) => void;
  clear: () => void;
  has: (slug: string) => boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readStored(): CompareEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("opencatalog-compare");
      if (legacy) {
        const parsed = JSON.parse(legacy) as unknown;
        if (Array.isArray(parsed)) {
          return parsed
            .filter((s): s is string => typeof s === "string")
            .map((slug) => ({ slug, name: slug }));
        }
      }
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is CompareEntry =>
          typeof e === "object" &&
          e !== null &&
          "slug" in e &&
          typeof (e as CompareEntry).slug === "string",
      )
      .map((e) => ({
        slug: e.slug,
        name: typeof e.name === "string" ? e.name : e.slug,
      }));
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CompareEntry[]>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const add = useCallback((entry: CompareEntry) => {
    let added = false;
    setEntries((prev) => {
      if (prev.some((e) => e.slug === entry.slug)) return prev;
      added = true;
      return [...prev, entry];
    });
    return added;
  }, []);

  const remove = useCallback((slug: string) => {
    setEntries((prev) => prev.filter((e) => e.slug !== slug));
  }, []);

  const toggle = useCallback((entry: CompareEntry) => {
    setEntries((prev) => {
      if (prev.some((e) => e.slug === entry.slug)) {
        return prev.filter((e) => e.slug !== entry.slug);
      }
      return [...prev, entry];
    });
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const has = useCallback(
    (slug: string) => entries.some((e) => e.slug === slug),
    [entries],
  );

  const slugs = useMemo(() => entries.map((e) => e.slug), [entries]);

  const value = useMemo(
    () => ({ entries, slugs, add, remove, toggle, clear, has }),
    [entries, slugs, add, remove, toggle, clear, has],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return ctx;
}
