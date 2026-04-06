"use client";

import { useCompare } from "@/components/catalog/CompareProvider";
import { cn } from "@/lib/utils";

export function ToolCompareToggle({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const { toggle, has } = useCompare();
  const selected = has(slug);

  return (
    <button
      type="button"
      onClick={() => toggle({ slug, name })}
      aria-pressed={selected}
      title={
        selected
          ? `Remove ${name} from comparison`
          : `Add ${name} to comparison`
      }
      className={cn(
        "rounded-xl border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
          : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]",
      )}
    >
      {selected ? "Added to compare" : "Add to compare"}
    </button>
  );
}
