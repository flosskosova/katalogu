"use client";

import { CategoryCard } from "@/components/catalog/CategoryCard";
import {
  ListRowColumnProvider,
} from "@/components/catalog/ListRowColumnMeasure";
import { CategoryListRow } from "@/components/catalog/CategoryListRow";
import { useViewMode } from "@/components/catalog/ViewModeProvider";
import { getCategoryContainerClass } from "@/lib/catalog-layout";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export type CategoryWithCount = Category & { count: number };

function toolCountLabel(count: number) {
  return `${count} tool${count === 1 ? "" : "s"}`;
}

export function CategoryResultsView({
  categories,
  className,
}: {
  categories: CategoryWithCount[];
  className?: string;
}) {
  const { viewMode } = useViewMode();
  const titleLabels = useMemo(
    () => categories.map((c) => c.name),
    [categories],
  );
  const badgeLabels = useMemo(
    () => categories.map((c) => toolCountLabel(c.count)),
    [categories],
  );

  const body = categories.map((category) =>
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
  );

  const containerClass = cn(getCategoryContainerClass(viewMode), className);

  if (viewMode !== "list") {
    return <div className={containerClass}>{body}</div>;
  }

  return (
    <ListRowColumnProvider
      titleLabels={titleLabels}
      badgeLabels={badgeLabels}
      badgeFont="600 12px var(--font-brand), ui-sans-serif, system-ui, sans-serif"
      badgePaddingPx={20}
    >
      <div className={containerClass}>{body}</div>
    </ListRowColumnProvider>
  );
}
