import { Suspense } from "react";
import type { Metadata } from "next";
import { BrowseFilters } from "@/components/catalog/BrowseFilters";
import { ToolResultsView } from "@/components/catalog/ToolResultsView";
import { ViewModeToggle } from "@/components/catalog/ViewModeToggle";
import { getAllPlatforms, getAllTags, getCatalogData, getCategories } from "@/lib/catalog";
import { filterTools } from "@/lib/search";
import { parseSearchParams } from "@/lib/search-params";
import type { ToolWithCategory } from "@/lib/types";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";

const browseDesc =
  "Search and filter curated free and open source software by category, platform, license, tags, maturity, and editorial facets—names, summaries, and use cases included.";

function hasActiveBrowseFilters(
  sp: Record<string, string | string[] | undefined>,
): boolean {
  const filters = parseSearchParams(sp);
  return Boolean(
    filters.query ||
      filters.categorySlug ||
      filters.platforms.length ||
      filters.licenseContains ||
      filters.privacyFocused !== null ||
      filters.selfHosted !== null ||
      filters.beginnerFriendly !== null ||
      filters.maturity !== null ||
      filters.maintenanceStatus !== null ||
      filters.tags.length,
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const isFiltered = hasActiveBrowseFilters(sp);

  return {
    title: "Browse & filter",
    description: browseDesc,
    keywords: [
      ...SITE.keywords,
      "filter open source",
      "FOSS search",
      "software by license",
    ],
    alternates: {
      canonical: "/browse",
      languages: { en: absoluteUrl("/browse") },
    },
    openGraph: {
      title: `Browse & filter · ${SITE.name}`,
      description: browseDesc,
      type: "website",
      url: absoluteUrl("/browse"),
      siteName: SITE.name,
      locale: SITE.locale,
      images: [
        { url: "/opengraph-image", width: 1200, height: 630, alt: SITE.name },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: getTwitterSite(),
      creator: getTwitterCreator(),
      title: `Browse & filter · ${SITE.name}`,
      description: browseDesc,
      images: ["/opengraph-image"],
    },
    robots: { index: !isFiltered, follow: true },
  };
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseSearchParams(sp);
  const { tools: allWithCategory } = await getCatalogData();
  const matched = filterTools(filters, allWithCategory);
  const slugSet = new Set(matched.map((t) => t.slug));
  const results: ToolWithCategory[] = allWithCategory.filter((t) =>
    slugSet.has(t.slug),
  );

  const categories = await getCategories();
  const platformOptions = await getAllPlatforms();
  const tagOptions = await getAllTags();

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-brand)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Browse &amp; filter
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--foreground-muted)]">
          Filter by platform, license text, maturity, maintenance cadence, and
          editorial tags like privacy-focused or self-hosted. Search matches
          names, summaries, tags, and use cases.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-48 animate-pulse rounded-2xl bg-[var(--muted)]" aria-hidden />
        }
      >
        <BrowseFilters
          categories={categories}
          platformOptions={platformOptions}
          tagOptions={tagOptions}
          className="mb-10"
        />
      </Suspense>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--foreground-muted)]" role="status">
          {results.length} tool{results.length === 1 ? "" : "s"} match your filters
        </p>
        <ViewModeToggle />
      </div>

      <ToolResultsView tools={results} />

      {results.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center text-[var(--foreground-muted)]">
          No tools match. Try clearing facets or broadening your search.
        </p>
      ) : null}
    </div>
  );
}
