"use client";

import { ToolCard } from "@/components/catalog/ToolCard";
import { ListRowColumnProvider } from "@/components/catalog/ListRowColumnMeasure";
import { ToolListRow } from "@/components/catalog/ToolListRow";
import { useViewMode } from "@/components/catalog/ViewModeProvider";
import { getToolContainerClass } from "@/lib/catalog-layout";
import type { ToolWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function ToolResultsView({
  tools,
  className,
}: {
  tools: ToolWithCategory[];
  className?: string;
}) {
  const { viewMode } = useViewMode();
  const titleLabels = useMemo(() => tools.map((t) => t.name), [tools]);
  const badgeLabels = useMemo(
    () => tools.map((t) => t.category.name),
    [tools],
  );

  const body = tools.map((tool) =>
    viewMode === "list" ? (
      <ToolListRow key={tool.slug} tool={tool} />
    ) : (
      <ToolCard key={tool.slug} tool={tool} />
    ),
  );

  const containerClass = cn(getToolContainerClass(viewMode), className);

  if (viewMode !== "list") {
    return <div className={containerClass}>{body}</div>;
  }

  return (
    <ListRowColumnProvider titleLabels={titleLabels} badgeLabels={badgeLabels}>
      <div className={containerClass}>{body}</div>
    </ListRowColumnProvider>
  );
}
