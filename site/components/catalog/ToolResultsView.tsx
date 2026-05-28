"use client";

import { ToolCard } from "@/components/catalog/ToolCard";
import { ToolListRow } from "@/components/catalog/ToolListRow";
import { useViewMode } from "@/components/catalog/ViewModeProvider";
import { getToolContainerClass } from "@/lib/catalog-layout";
import type { ToolWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ToolResultsView({
  tools,
  className,
}: {
  tools: ToolWithCategory[];
  className?: string;
}) {
  const { viewMode } = useViewMode();

  return (
    <div className={cn(getToolContainerClass(viewMode), className)}>
      {tools.map((tool) =>
        viewMode === "list" ? (
          <ToolListRow key={tool.slug} tool={tool} />
        ) : (
          <ToolCard key={tool.slug} tool={tool} />
        ),
      )}
    </div>
  );
}
