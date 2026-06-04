"use client";

import { useCompare } from "@/components/catalog/CompareProvider";
import { Button } from "@/components/ui/Button";

export function CompareBar() {
  const { entries, remove, clear, slugs } = useCompare();
  if (entries.length === 0) return null;

  const href = `/compare?ids=${encodeURIComponent(slugs.join(","))}`;

  return (
    <div
      role="region"
      aria-label="Comparison selection"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-nowrap items-center gap-2">
          <span className="shrink-0 text-sm font-medium text-[var(--foreground)]">
            Compare ({entries.length})
          </span>
          <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
            {entries.map((e) => (
              <li key={e.slug} className="max-w-full shrink-0">
                <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                  <span className="min-w-0 truncate" title={e.name}>
                    {e.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(e.slug)}
                    className="rounded p-0.5 text-[var(--foreground-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                    aria-label={`Remove ${e.name} from comparison`}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={clear} className="!text-sm">
            Clear
          </Button>
          <Button href={href} variant="primary" className="!text-sm">
            Open comparison
          </Button>
        </div>
      </div>
    </div>
  );
}
