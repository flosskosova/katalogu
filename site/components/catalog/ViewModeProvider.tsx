"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

function readStored(): ViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewModeState((prev) => (prev === "grid" ? "list" : "grid"));
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
