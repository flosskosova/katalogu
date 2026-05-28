import type { ViewMode } from "@/components/catalog/ViewModeProvider";

export function getToolContainerClass(viewMode: ViewMode): string {
  return viewMode === "list"
    ? "flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"
    : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";
}

export function getCategoryContainerClass(viewMode: ViewMode): string {
  return viewMode === "list"
    ? "flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"
    : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
}
