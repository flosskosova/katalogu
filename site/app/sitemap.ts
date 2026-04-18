import type { MetadataRoute } from "next";
import {
  getAllTools,
  getCategories,
  getPublishedCollectionSlugs,
} from "@/lib/catalog";
import { getSiteUrl } from "@/lib/seo/site";

/** Avoid build-time static generation: CMS + many URLs can exceed the default ~60s budget on Vercel. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/browse",
    "/categories",
    "/compare",
    "/suggest",
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const cats = await getCategories();
  const categories = cats.map((c) => ({
    url: `${base}/categories/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const allTools = await getAllTools();
  const tools = allTools.map((t) => ({
    url: `${base}/tools/${t.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const collSlugs = await getPublishedCollectionSlugs();
  const collections = collSlugs.map((slug) => ({
    url: `${base}/collections/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  return [...staticRoutes, ...categories, ...tools, ...collections];
}
