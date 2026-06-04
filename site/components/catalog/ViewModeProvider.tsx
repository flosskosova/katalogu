"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "opencatalog-view-mode-v1";

export type ViewMode = "grid" | "list";

type ViewModeContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isList: boolean;
  isGrid: boolean;
};

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

type Listener = () => void;
const listeners = new Set<Listener>();

function emitViewModeChange() {
  listeners.forEach((l) => l());
}

function subscribe(callback: Listener) {
  listeners.add(callback);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(callback);
    };
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function readStored(): ViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function getSnapshot(): ViewMode {
  return readStored();
}

function getServerSnapshot(): ViewMode {
  return "grid";
}

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const viewMode = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setViewMode = useCallback((mode: ViewMode) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      return;
    }
    emitViewModeChange();
  }, []);

  const toggleViewMode = useCallback(() => {
    if (typeof window === "undefined") return;
    const next: ViewMode = readStored() === "grid" ? "list" : "grid";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    }
    emitViewModeChange();
  }, []);

  const value = useMemo(
    () => ({
      viewMode,
      setViewMode,
      toggleViewMode,
      isList: viewMode === "list",
      isGrid: viewMode === "grid",
    }),
    [viewMode, setViewMode, toggleViewMode],
  );

  return (
    <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) {
    throw new Error("useViewMode must be used within ViewModeProvider");
  }
  return ctx;
}
