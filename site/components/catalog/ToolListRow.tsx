"use client";

import Link from "next/link";
import { useCompare } from "@/components/catalog/CompareProvider";
import { Badge } from "@/components/ui/Badge";
import type { ToolWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const rankLabel: Record<string, string> = {
  "top-pick": "Top pick",
  "also-strong": "Also strong",
  honorable: "Honorable mention",
};

export function ToolListRow({ tool }: { tool: ToolWithCategory }) {
  const { toggle, has } = useCompare();
  const selected = has(tool.slug);
  const entry = { slug: tool.slug, name: tool.name };

  return (
    <article className="group flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)]/40 sm:flex-row sm:items-center sm:gap-4 sm:py-3.5">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground-muted)] sm:mt-0"
          aria-hidden
        >
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
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-nowrap items-center gap-x-2">
            <h3 className="min-w-0 flex-1 overflow-hidden font-[family-name:var(--font-brand)] text-base font-semibold tracking-tight text-[var(--foreground)]">
              <Link
                href={`/tools/${tool.slug}`}
                className="inline-block max-w-full truncate rounded px-0.5 py-px align-baseline outline-none transition-colors hover:bg-[#fff200]/50 hover:text-[#14120f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                title={tool.name}
              >
                {tool.name}
              </Link>
            </h3>
            <Badge
              tone="accent"
              className="shrink-0"
              href={`/categories/${tool.category.slug}`}
            >
              {tool.category.name}
            </Badge>
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-[var(--foreground-muted)]">
            {tool.summary}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-12 sm:pl-0">
        <span className="hidden text-xs font-medium uppercase tracking-wider text-[var(--foreground-subtle)] sm:inline">
          {rankLabel[tool.rank] ?? tool.rank}
        </span>
        <button
          type="button"
          onClick={() => toggle(entry)}
          aria-pressed={selected}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
            selected
              ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[#14120f]"
              : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--muted)]",
          )}
        >
          {selected ? "In compare" : "Compare"}
        </button>
      </div>
    </article>
  );
}
