import Link from "next/link";
import { flosskHighlight } from "@/lib/ui/flossk-highlight";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryCard({
  category,
  count,
}: {
  category: Category;
  count: number;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
    >
      <p className={cn(flosskHighlight, "inline-flex px-2 py-0.5 text-xs uppercase tracking-wider")}>
        {count} tools
      </p>
      <h2 className="mt-2 min-w-0 overflow-hidden font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]">
        <span
          className="inline-block max-w-full truncate rounded-sm px-0.5 py-px align-baseline transition-[background-color,opacity] group-hover:bg-[#fff200]/95 group-hover:text-[var(--foreground)] dark:group-hover:bg-[#fff200]/35 dark:group-hover:text-[var(--foreground-muted)]"
          title={category.name}
        >
          {category.name}
        </span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
        {category.summary}
      </p>
    </Link>
  );
}
