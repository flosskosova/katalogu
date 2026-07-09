"use client";

import Link from "next/link";
import { ToolLogo } from "@/components/catalog/ToolLogo";
import { useListRowColumns } from "@/components/catalog/ListRowColumnMeasure";
import { useCompare } from "@/components/catalog/CompareProvider";
import { Badge } from "@/components/ui/Badge";
import type { ToolWithCategory } from "@/lib/types";
import { flosskTextLink } from "@/lib/ui/flossk-highlight";
import { cn } from "@/lib/utils";

const rankLabel: Record<string, string> = {
  "top-pick": "Top pick",
  "also-strong": "Also strong",
  honorable: "Honorable mention",
};

export function ToolListRow({ tool }: { tool: ToolWithCategory }) {
  const { toggle, has } = useCompare();
  const cols = useListRowColumns();
  const selected = has(tool.slug);
  const entry = { slug: tool.slug, name: tool.name };

  return (
    <article className="group flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)]/40 sm:flex-row sm:items-center sm:gap-4 sm:py-3.5">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <ToolLogo
          name={tool.name}
          slug={tool.slug}
          logoUrl={tool.logoUrl}
          size="list"
          className="mt-0.5 sm:mt-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-x-2">
            <h3
              className={cn(
                "min-w-0 overflow-hidden font-[family-name:var(--font-brand)] text-base font-semibold tracking-tight text-[var(--foreground)]",
                cols?.titleColPx ? "shrink" : "min-w-0 flex-1",
              )}
              style={
                cols?.titleColPx
                  ? {
                      width: cols.titleColPx,
                      maxWidth: cols.titleColPx,
                    }
                  : undefined
              }
            >
              <Link
                href={`/tools/${tool.slug}`}
                className={cn(
                  flosskTextLink,
                  "block w-full max-w-full truncate outline-none",
                )}
                title={tool.name}
              >
                {tool.name}
              </Link>
            </h3>
            <div
              className="flex shrink-0 justify-end"
              style={
                cols?.badgeColPx
                  ? {
                      width: cols.badgeColPx,
                      minWidth: cols.badgeColPx,
                    }
                  : undefined
              }
            >
              <Badge
                tone="accent"
                className="shrink-0"
                href={`/categories/${tool.category.slug}`}
              >
                {tool.category.name}
              </Badge>
            </div>
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
