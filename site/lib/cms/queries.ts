import { draftMode } from "next/headers";
import {
  filterCuratedCollectionForPublicSite,
  mapCategoryDoc,
  mapCuratedCollectionDoc,
  mapToolDoc,
} from "@/lib/cms/map-payload";
import {
  mergeCatalogCategories,
  mergeCatalogTools,
} from "@/lib/cms/merge-catalog";
import {
  getStaticCategories,
  getStaticToolsWithCategories,
} from "@/lib/cms/map-static";
import type {
  Category,
  CuratedCollectionView,
  Tool,
  ToolWithCategory,
} from "@/lib/types";
import type { Where } from "payload";
import { cache } from "react";

import { getPayloadClient } from "@/lib/payload";

const envForcesStaticCatalog = () =>
  process.env.USE_STATIC_CATALOG === "true";

/** When the CMS returns tools, also include static seed entries unless this is `false` (CMS wins on duplicate slugs). */
const cmsMergeStaticCatalog = () =>
  process.env.CMS_MERGE_STATIC_TOOLS !== "false";

/** Safe during `generateStaticParams` / build where request scope is missing */
async function draftPreviewActive(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}

function applyPublicWebsiteVisibility(
  categories: Category[],
  tools: ToolWithCategory[],
): { categories: Category[]; tools: ToolWithCategory[] } {
  const visibleCats = categories.filter((c) => c.visibleOnWebsite !== false);
  const slugSet = new Set(visibleCats.map((c) => c.slug));
  const visibleTools = tools.filter(
    (t) => t.visibleOnWebsite !== false && slugSet.has(t.categorySlug),
  );
  return { categories: visibleCats, tools: visibleTools };
}

async function loadFromCms(
  includeDrafts: boolean,
): Promise<{ categories: Category[]; tools: ToolWithCategory[] } | null> {
  if (envForcesStaticCatalog()) return null;
  try {
    const payload = await getPayloadClient();

    const catWhere = includeDrafts
      ? { status: { not_equals: "archived" } }
      : { status: { equals: "published" } };

    const catRes = await payload.find({
      collection: "catalog-categories",
      where: catWhere,
      limit: 200,
      sort: "sortOrder",
      overrideAccess: true,
    });

    const categories = catRes.docs.map((d) =>
      mapCategoryDoc(d as Parameters<typeof mapCategoryDoc>[0]),
    );

    let toolWhere: Where;
    if (includeDrafts) {
      toolWhere = { status: { not_equals: "archived" } };
    } else {
      toolWhere = {
        and: [
          { status: { equals: "published" } },
          { visibleOnWebsite: { equals: true } },
        ],
      };
    }

    const toolRes = await payload.find({
      collection: "catalog-tools",
      where: toolWhere,
      limit: 500,
      depth: 2,
      sort: "-editorialWeight",
      overrideAccess: true,
    });

    if (
      toolRes.docs.length === 0 &&
      process.env.CMS_FALLBACK_STATIC !== "false"
    ) {
      return null;
    }

    const tools: ToolWithCategory[] = toolRes.docs.map((d) => {
      const raw = d as Record<string, unknown>;
      const rc = raw.category as
        | { slug?: string; name?: string; summary?: string; description?: string }
        | string
        | number
        | null
        | undefined;

      let cat: Category | undefined;
      if (rc && typeof rc === "object" && rc.slug) {
        cat = categories.find((c) => c.slug === rc.slug);
      }

      return mapToolDoc(raw as never, cat);
    });

    return { categories, tools };
  } catch {
    return null;
  }
}

/**
 * One CMS read per React server request — `Promise.all([getTopPicks(), getCategories(), …])`
 * otherwise hit Postgres several times in parallel and stall with a tiny serverless pool (`max: 1–2`).
 */
export const getCatalogData = cache(async function getCatalogData(): Promise<{
  categories: Category[];
  tools: ToolWithCategory[];
}> {
  const preview = await draftPreviewActive();
  const staticCategories = getStaticCategories();
  const staticTools = getStaticToolsWithCategories();

  if (envForcesStaticCatalog()) {
    return { categories: staticCategories, tools: staticTools };
  }

  const cms = await loadFromCms(preview);

  if (!cms || cms.tools.length === 0) {
    const base = { categories: staticCategories, tools: staticTools };
    return preview ? base : applyPublicWebsiteVisibility(base.categories, base.tools);
  }

  if (!cmsMergeStaticCatalog()) {
    const base = { categories: cms.categories, tools: cms.tools };
    return preview ? base : applyPublicWebsiteVisibility(base.categories, base.tools);
  }

  const categoriesMerged = mergeCatalogCategories(cms.categories);
  const toolsMerged = mergeCatalogTools(
    cms.tools,
    staticTools,
    categoriesMerged,
  );
  const merged = { categories: categoriesMerged, tools: toolsMerged };
  return preview ? merged : applyPublicWebsiteVisibility(merged.categories, merged.tools);
});

export async function getCategories(): Promise<Category[]> {
  const { categories } = await getCatalogData();
  return categories;
}

export async function getCategoriesWithCounts(): Promise<
  (Category & { count: number })[]
> {
  const { categories, tools } = await getCatalogData();
  const countBySlug = new Map<string, number>();
  for (const tool of tools) {
    countBySlug.set(
      tool.categorySlug,
      (countBySlug.get(tool.categorySlug) ?? 0) + 1,
    );
  }
  return categories.map((category) => ({
    ...category,
    count: countBySlug.get(category.slug) ?? 0,
  }));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | undefined> {
  const { categories } = await getCatalogData();
  return categories.find((c) => c.slug === slug);
}

export async function getToolCount(): Promise<number> {
  const { tools } = await getCatalogData();
  return tools.length;
}

export async function getAllTools(): Promise<Tool[]> {
  const { tools } = await getCatalogData();
  return tools;
}

export async function getToolBySlug(
  slug: string,
): Promise<Tool | undefined> {
  const { tools } = await getCatalogData();
  return tools.find((t) => t.slug === slug);
}

export async function getToolsByCategory(
  slug: string,
): Promise<ToolWithCategory[]> {
  const { tools } = await getCatalogData();
  return tools.filter((t) => t.categorySlug === slug);
}

export async function withCategory(
  tool: Tool,
): Promise<ToolWithCategory | undefined> {
  const cat = await getCategoryBySlug(tool.categorySlug);
  if (!cat) return undefined;
  return { ...tool, category: cat };
}

export async function getRelatedTools(
  tool: Tool,
  limit = 6,
): Promise<ToolWithCategory[]> {
  const { tools } = await getCatalogData();
  const explicit = (tool.relatedSlugs ?? [])
    .map((s) => tools.find((t) => t.slug === s))
    .filter(Boolean) as Tool[];

  const seen = new Set<string>([tool.slug, ...explicit.map((t) => t.slug)]);
  const scored: { t: Tool; score: number }[] = [];

  for (const t of tools) {
    if (seen.has(t.slug)) continue;
    let score = 0;
    if (t.categorySlug === tool.categorySlug) score += 3;
    const shared = t.tags.filter((tag) => tool.tags.includes(tag));
    score += shared.length * 2;
    if (score > 0) scored.push({ t, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const merged = [...explicit, ...scored.map((s) => s.t)];
  const out: ToolWithCategory[] = [];
  for (const t of merged) {
    if (out.length >= limit) break;
    const wc = await withCategory(t);
    if (wc) out.push(wc);
  }
  return out;
}

export async function getAllTags(): Promise<string[]> {
  const { tools } = await getCatalogData();
  const set = new Set<string>();
  for (const t of tools) t.tags.forEach((tag) => set.add(tag));
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getAllPlatforms(): Promise<string[]> {
  const { tools } = await getCatalogData();
  const set = new Set<string>();
  for (const t of tools) t.platforms.forEach((p) => set.add(p));
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getTopPicks(limit = 8): Promise<ToolWithCategory[]> {
  const { tools } = await getCatalogData();
  const picks = tools.filter(
    (t) => t.rank === "top-pick" || t.homepageTopPick === true,
  );
  const sorted = [...picks].sort(
    (a, b) => (b.editorialWeight ?? 0) - (a.editorialWeight ?? 0),
  );
  return sorted.slice(0, limit);
}

export async function getFeaturedCuratedCollections(
  limit = 4,
): Promise<CuratedCollectionView[]> {
  if (envForcesStaticCatalog()) return [];
  try {
    const payload = await getPayloadClient();
    const preview = await draftPreviewActive();
    const statusWhere = preview
      ? { status: { not_equals: "archived" as const } }
      : { status: { equals: "published" as const } };
    const res = await payload.find({
      collection: "curated-collections",
      where: {
        and: [statusWhere, { featured: { equals: true } }],
      },
      limit,
      depth: 4,
      sort: "-updatedAt",
      overrideAccess: true,
    });
    const mapped = res.docs.map((d) =>
      mapCuratedCollectionDoc(d as Record<string, unknown>),
    );
    return preview
      ? mapped
      : mapped.map(filterCuratedCollectionForPublicSite);
  } catch {
    return [];
  }
}

export async function getCuratedCollectionBySlug(
  slug: string,
): Promise<CuratedCollectionView | undefined> {
  if (envForcesStaticCatalog()) return undefined;
  try {
    const payload = await getPayloadClient();
    const preview = await draftPreviewActive();
    const statusWhere = preview
      ? { status: { not_equals: "archived" as const } }
      : { status: { equals: "published" as const } };
    const res = await payload.find({
      collection: "curated-collections",
      where: {
        and: [statusWhere, { slug: { equals: slug } }],
      },
      limit: 1,
      depth: 4,
      overrideAccess: true,
    });
    const doc = res.docs[0];
    if (!doc) return undefined;
    const col = mapCuratedCollectionDoc(doc as Record<string, unknown>);
    return preview ? col : filterCuratedCollectionForPublicSite(col);
  } catch {
    return undefined;
  }
}

export async function getPublishedCollectionSlugs(): Promise<string[]> {
  if (envForcesStaticCatalog()) return [];
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "curated-collections",
      where: { status: { equals: "published" } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    });
    return res.docs.map((d) => String((d as { slug?: string }).slug ?? ""));
  } catch {
    return [];
  }
}
