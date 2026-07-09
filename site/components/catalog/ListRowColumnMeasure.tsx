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
  titleFont = '600 16px var(--font-brand), ui-sans-serif, system-ui, sans-serif',
  /** Inline title padding (flosskTextHighlightPadding) + truncate slack */
  titlePaddingPx = 12,
  badgeFont = '600 11px var(--font-brand), ui-sans-serif, system-ui, sans-serif',
  badgePaddingPx = 22,
  children,
}: {
  titleLabels: string[];
  badgeLabels: string[];
  titleFont?: string;
  titlePaddingPx?: number;
  badgeFont?: string;
  badgePaddingPx?: number;
  children: ReactNode;
}) {
  const titleKey = useMemo(() => titleLabels.join("\0"), [titleLabels]);
  const badgeKey = useMemo(() => badgeLabels.join("\0"), [badgeLabels]);

  const [titleColPx, setTitleColPx] = useState<number | undefined>();
  const [badgeColPx, setBadgeColPx] = useState<number | undefined>();

  useLayoutEffect(() => {
    setTitleColPx(measureTextColumnPx(titleLabels, titleFont, titlePaddingPx));
  }, [titleKey, titleLabels, titleFont, titlePaddingPx]);

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
