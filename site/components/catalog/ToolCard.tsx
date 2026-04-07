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

export function ToolCard({
  tool,
  className,
}: {
  tool: ToolWithCategory;
  className?: string;
}) {
  const { toggle, has } = useCompare();
  const selected = has(tool.slug);
  const entry = { slug: tool.slug, name: tool.name };

  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-[box-shadow,transform] duration-300 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge
            tone="accent"
            className="mb-2"
            href={`/categories/${tool.category.slug}`}
          >
            {tool.category.name}
          </Badge>
          <h3 className="font-[family-name:var(--font-brand)] text-xl font-semibold tracking-tight text-[var(--foreground)]">
            <Link
              href={`/tools/${tool.slug}`}
              className="rounded transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            >
              {tool.name}
            </Link>
          </h3>
        </div>
        <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--foreground-subtle)]">
          {rankLabel[tool.rank] ?? tool.rank}
        </span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">
        {tool.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tool.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--foreground-muted)]"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={() => toggle(entry)}
          aria-pressed={selected}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
            selected
              ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
              : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--muted)]",
          )}
        >
          {selected ? "In compare" : "Compare"}
        </button>
      </div>
    </article>
  );
}
