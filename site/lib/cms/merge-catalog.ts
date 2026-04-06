import { withProprietaryAlternativeNote } from "@/data/proprietary-alternatives";
import { getStaticCategories } from "@/lib/cms/map-static";
import type { Category, ToolWithCategory } from "@/lib/types";

/** Same pattern as auto-import list generators — not a real editorial “why”. */
function isGithubListWhyIncludedBoilerplate(why: string): boolean {
  const s = why.trim();
  return s.includes("Listed in [") && s.includes("](https://github.com/");
}

/**
 * Overlay CMS category fields onto the static taxonomy (preserves static slug order).
 * Appends CMS-only slugs not present in static `categories.ts`.
 */
export function mergeCatalogCategories(cmsCategories: Category[]): Category[] {
  const base = getStaticCategories();
  const cmsBySlug = new Map(cmsCategories.map((c) => [c.slug, c]));
  const mergedInStaticOrder = base.map((c) => cmsBySlug.get(c.slug) ?? c);
  const staticSlugs = new Set(base.map((c) => c.slug));
  const cmsOnly = cmsCategories.filter((c) => !staticSlugs.has(c.slug));
  return [...mergedInStaticOrder, ...cmsOnly];
}

/**
 * CMS tools win on duplicate `slug`; static-only entries fill out the rest of the seed catalog.
 * If the CMS row still has auto-list “why included” copy, use the static entry’s `whyIncluded`
 * so the public site matches curated static data until `seed:catalog` refreshes Payload.
 * Re-resolves `category` from the merged category list so overlays apply everywhere.
 */
export function mergeCatalogTools(
  cmsTools: ToolWithCategory[],
  staticTools: ToolWithCategory[],
  categories: Category[],
): ToolWithCategory[] {
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const staticBySlug = new Map(staticTools.map((t) => [t.slug, t]));
  const cmsSlugs = new Set(cmsTools.map((t) => t.slug));
  const staticOnly = staticTools.filter((t) => !cmsSlugs.has(t.slug));

  const attach = (t: ToolWithCategory): ToolWithCategory => {
    const cat = catBySlug.get(t.categorySlug) ?? t.category;
    return { ...t, category: cat };
  };

  const cmsWithStaticWhy = cmsTools.map((t) => {
    const cmsWhy = String(t.whyIncluded ?? "");
    if (!isGithubListWhyIncludedBoilerplate(cmsWhy)) return t;
    const st = staticBySlug.get(t.slug);
    const staticWhy = String(st?.whyIncluded ?? "").trim();
    if (!st || !staticWhy || isGithubListWhyIncludedBoilerplate(staticWhy)) {
      return t;
    }
    return { ...t, whyIncluded: staticWhy };
  });

  return [...cmsWithStaticWhy.map(attach), ...staticOnly.map(attach)].map((t) =>
    withProprietaryAlternativeNote(t),
  );
}
