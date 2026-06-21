import Link from "next/link";
import { useListRowColumns } from "@/components/catalog/ListRowColumnMeasure";
import { flosskHighlight } from "@/lib/ui/flossk-highlight";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryListRow({
  category,
  count,
}: {
  category: Category;
  count: number;
}) {
  const cols = useListRowColumns();
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--muted)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)] sm:gap-4"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground-muted)]"
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
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-nowrap items-end gap-x-2">
          <h2
            className={cn(
              "inline-flex items-end overflow-hidden font-[family-name:var(--font-brand)] text-base font-semibold leading-none text-[var(--foreground)]",
              cols?.titleColPx ? "shrink-0" : "min-w-0 flex-1",
            )}
            style={
              cols?.titleColPx
                ? {
                    width: cols.titleColPx,
                    minWidth: cols.titleColPx,
                    maxWidth: cols.titleColPx,
                  }
                : undefined
            }
          >
            <span
              className="inline-block max-w-full truncate rounded-sm px-0.5 py-px align-baseline transition-[background-color,opacity] group-hover:bg-[#fff200]/95 group-hover:text-[var(--foreground)] dark:group-hover:bg-[#fff200]/35 dark:group-hover:text-[var(--foreground-muted)]"
              title={category.name}
            >
              {category.name}
            </span>
          </h2>
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
            <span
              className={cn(
                flosskHighlight,
                "inline-flex shrink-0 items-center px-2 py-px text-xs leading-none",
              )}
            >
              {count} tool{count === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-[var(--foreground-muted)]">
          {category.summary}
        </p>
      </div>
      <span
        className="shrink-0 text-[var(--foreground-subtle)] transition-transform group-hover:translate-x-0.5"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
