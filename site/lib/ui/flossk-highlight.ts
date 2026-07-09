import { cn } from "@/lib/utils";

/** Yellow FLOSSK highlight — badges, header CTAs, brand labels */
export const flosskHighlight =
  "rounded-sm border-0 bg-[#fff200]/95 font-[family-name:var(--font-brand)] font-semibold tracking-wide text-[var(--foreground)] [box-decoration-break:clone] dark:bg-[#fff200]/35 dark:text-[var(--foreground-muted)]";

/** Comfortable inner spacing for solid yellow pills and category badges */
export const flosskHighlightPill = "px-2.5 py-1";

/** Tighter padding for inline title hover highlights */
export const flosskTextHighlightPadding = "px-1 py-0.5";

export const flosskHighlightInteractive =
  "transition-[background-color,opacity] hover:bg-[#e0cd00]/95 hover:text-[var(--foreground)] dark:hover:bg-[#fff200]/55 dark:hover:text-[var(--foreground)]";

/** Solid yellow kicker / brand label (homepage, header, about) */
export const flosskHighlightLabel = cn(
  "inline-block w-fit",
  flosskHighlight,
  flosskHighlightPill,
);

/** Inline title / nav text — foreground with yellow highlight on hover */
export const flosskTextLink = cn(
  "inline-block rounded-sm align-baseline text-base font-semibold text-[var(--foreground)] transition-[background-color,opacity] hover:bg-[#fff200]/95 hover:text-[var(--foreground)] dark:hover:bg-[#fff200]/35 dark:hover:text-[var(--foreground-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
  flosskTextHighlightPadding,
);
