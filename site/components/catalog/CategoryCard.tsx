import Link from "next/link";
import type { Category } from "@/lib/types";
import { getToolsByCategory } from "@/lib/catalog";

export async function CategoryCard({ category }: { category: Category }) {
  const list = await getToolsByCategory(category.slug);
  const count = list.length;
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
        {count} tools
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
        {category.name}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
        {category.summary}
      </p>
    </Link>
  );
}
