/**
 * Single source of truth for `catalog-tools` slug shape (Payload `beforeChange` hook).
 * Static `data/tools` entries must satisfy this or `seed:catalog` will fail.
 */
export const CATALOG_TOOL_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isCatalogToolSlugValid(slug: string): boolean {
  return CATALOG_TOOL_SLUG_RE.test(slug);
}

/**
 * Map repo-derived or upstream slugs (underscores, dots, etc.) into a Payload-safe slug.
 */
export function normalizeToCatalogToolSlug(raw: string): string {
  const s = String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (s && CATALOG_TOOL_SLUG_RE.test(s)) return s;
  return "app";
}
