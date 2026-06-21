"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ListRowColumnMeasure = {
  titleColPx: number | undefined;
  badgeColPx: number | undefined;
};

const ListRowColumnContext = createContext<ListRowColumnMeasure | null>(null);

function measureTextColumnPx(
  labels: string[],
  font: string,
  extraPx = 4,
): number | undefined {
  if (labels.length === 0 || typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.font = font;
  const max = Math.max(...labels.map((label) => ctx.measureText(label).width));
  return Math.ceil(max) + extraPx;
}

/** Sizes title + badge columns from the longest labels in the current list (canvas measure). */
export function ListRowColumnProvider({
  titleLabels,
  badgeLabels,
  badgeFont = '600 11px var(--font-brand), ui-sans-serif, system-ui, sans-serif',
  badgePaddingPx = 8,
  children,
}: {
  titleLabels: string[];
  badgeLabels: string[];
  /** Canvas font for badge column (tool category pills are ~11px; counts use 12px). */
  badgeFont?: string;
  badgePaddingPx?: number;
  children: ReactNode;
}) {
  const titleKey = useMemo(() => titleLabels.join("\0"), [titleLabels]);
  const badgeKey = useMemo(() => badgeLabels.join("\0"), [badgeLabels]);

  const [titleColPx, setTitleColPx] = useState<number | undefined>();
  const [badgeColPx, setBadgeColPx] = useState<number | undefined>();

  useLayoutEffect(() => {
    setTitleColPx(
      measureTextColumnPx(
        titleLabels,
        '600 16px var(--font-brand), ui-sans-serif, system-ui, sans-serif',
      ),
    );
  }, [titleKey, titleLabels]);

  useLayoutEffect(() => {
    setBadgeColPx(measureTextColumnPx(badgeLabels, badgeFont, badgePaddingPx));
  }, [badgeKey, badgeLabels, badgeFont, badgePaddingPx]);

  const value = useMemo(
    () => ({ titleColPx, badgeColPx }),
    [titleColPx, badgeColPx],
  );

  return (
    <ListRowColumnContext.Provider value={value}>
      {children}
    </ListRowColumnContext.Provider>
  );
}

export function useListRowColumns(): ListRowColumnMeasure | null {
  return useContext(ListRowColumnContext);
}
