/**
 * Public catalog data access (CMS with static fallback).
 * All functions are async — use from Server Components or server handlers.
 */
export {
  getAllPlatforms,
  getAllTags,
  getAllTools,
  getCatalogData,
  getCategories,
  getCategoriesWithCounts,
  getCategoryBySlug,
  getCuratedCollectionBySlug,
  getFeaturedCuratedCollections,
  getPublishedCollectionSlugs,
  getRelatedTools,
  getToolBySlug,
  getToolCount,
  getToolsByCategory,
  getTopPicks,
  withCategory,
} from "@/lib/cms/queries";
