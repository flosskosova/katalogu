import type { SearchFilters, Tool } from "@/lib/types";

function matchesQuery(tool: Tool, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  const hay = [
    tool.name,
    tool.summary,
    tool.bestFor,
    tool.whyIncluded,
    ...tool.tags,
    ...tool.platforms,
    tool.license,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function filterTools(filters: SearchFilters, source: Tool[]): Tool[] {
  return source.filter((tool) => {
    if (!matchesQuery(tool, filters.query)) return false;
    if (filters.categorySlug && tool.categorySlug !== filters.categorySlug)
      return false;
    if (filters.platforms.length) {
      const ok = filters.platforms.some((p) => tool.platforms.includes(p));
      if (!ok) return false;
    }
    if (filters.licenseContains.trim()) {
      if (
        !tool.license
          .toLowerCase()
          .includes(filters.licenseContains.toLowerCase())
      )
        return false;
    }
    if (filters.privacyFocused === true && !tool.privacyFocused) return false;
    if (filters.selfHosted === true && !tool.selfHosted) return false;
    if (filters.beginnerFriendly === true && !tool.beginnerFriendly)
      return false;
    if (filters.maturity && tool.maturity !== filters.maturity) return false;
    if (
      filters.maintenanceStatus &&
      tool.maintenanceStatus !== filters.maintenanceStatus
    )
      return false;
    if (filters.tags.length) {
      const has = filters.tags.every((tag) => tool.tags.includes(tag));
      if (!has) return false;
    }
    return true;
  });
}

export function defaultFilters(): SearchFilters {
  return {
    query: "",
    categorySlug: null,
    platforms: [],
    licenseContains: "",
    privacyFocused: null,
    selfHosted: null,
    beginnerFriendly: null,
    maturity: null,
    maintenanceStatus: null,
    tags: [],
  };
}
