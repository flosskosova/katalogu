"use client";

import { CategoryCard } from "@/components/catalog/CategoryCard";
import { CategoryListRow } from "@/components/catalog/CategoryListRow";
import { useViewMode } from "@/components/catalog/ViewModeProvider";
import { getCategoryContainerClass } from "@/lib/catalog-layout";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CategoryWithCount = Category & { count: number };

export function CategoryResultsView({
  categories,
  className,
}: {
  categories: CategoryWithCount[];
  className?: string;
}) {
  const { viewMode } = useViewMode();

  return (
    <div className={cn(getCategoryContainerClass(viewMode), className)}>
      {categories.map((category) =>
        viewMode === "list" ? (
          <CategoryListRow
            key={category.slug}
            category={category}
            count={category.count}
          />
        ) : (
          <CategoryCard
            key={category.slug}
            category={category}
            count={category.count}
          />
        ),
      )}
    </div>
  );
}
