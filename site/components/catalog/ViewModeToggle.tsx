"use client";

import { useViewMode, type ViewMode } from "@/components/catalog/ViewModeProvider";
import { cn } from "@/lib/utils";

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

const options: { mode: ViewMode; label: string; Icon: typeof GridIcon }[] = [
  { mode: "grid", label: "Grid view", Icon: GridIcon },
  { mode: "list", label: "List view", Icon: ListIcon },
];

type ViewModeToggleProps = {
  className?: string;
  /** Compact icon-only toggle for the header */
  variant?: "segmented" | "icon";
};

export function ViewModeToggle({
  className,
  variant = "segmented",
}: ViewModeToggleProps) {
  const { viewMode, setViewMode } = useViewMode();

  if (variant === "icon") {
    const nextMode = viewMode === "grid" ? "list" : "grid";
    const label =
      viewMode === "grid" ? "Switch to list view" : "Switch to grid view";

    return (
      <button
        type="button"
        onClick={() => setViewMode(nextMode)}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-lg p-2 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
          className,
        )}
      >
        {viewMode === "grid" ? <ListIcon /> : <GridIcon />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="View mode"
      className={cn(
        "inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 p-0.5",
        className,
      )}
    >
      {options.map(({ mode, label, Icon }) => {
        const active = viewMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
              active
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
            )}
          >
            <Icon />
            <span className="hidden sm:inline">
              {mode === "grid" ? "Grid" : "List"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
