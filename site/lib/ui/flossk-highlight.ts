import { cn } from "@/lib/utils";

/** Solid yellow pill/badge — defined in globals.css (always shipped). */
export const flosskHighlight = "flossk-highlight";

export const flosskHighlightPill = "flossk-highlight-pill";

export const flosskHighlightSoft = "flossk-highlight-soft";

export const flosskHighlightInteractive = "flossk-highlight-interactive";

export const flosskHoverSurface = "flossk-hover-surface";

/** Solid yellow kicker / brand label (homepage, header, about) */
export const flosskHighlightLabel = cn(
  "inline-block w-fit",
  flosskHighlight,
  flosskHighlightPill,
);

/** Inline title / nav text — foreground with yellow highlight on hover */
export const flosskTextLink = "flossk-text-link";
