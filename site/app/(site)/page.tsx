import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/catalog/JsonLd";
import { CategoryResultsView } from "@/components/catalog/CategoryResultsView";
import { ToolResultsView } from "@/components/catalog/ToolResultsView";
import { Button } from "@/components/ui/Button";
import {
  getCategoriesWithCounts,
  getFeaturedCuratedCollections,
  getToolCount,
  getTopPicks,
} from "@/lib/catalog";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";
import { buildHomeFaqJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
  keywords: [
    ...SITE.keywords,
    "software comparison",
    "open source directory",
    "FOSS catalog",
  ],
  alternates: {
    canonical: "/",
    languages: { en: absoluteUrl("/") },
  },
  openGraph: {
    url: absoluteUrl("/"),
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: getTwitterSite(),
    creator: getTwitterCreator(),
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/opengraph-image"],
  },
};

export default async function HomePage() {
  const [picks, categoriesWithCounts, featuredLists, toolCount] = await Promise.all([
    getTopPicks(9),
    getCategoriesWithCounts(),
    getFeaturedCuratedCollections(4),
    getToolCount(),
  ]);
  const categoryPreview = categoriesWithCounts.slice(0, 9);

  return (
    <>
      <JsonLd data={buildHomeFaqJsonLd()} />
      <section className="border-b border-[var(--border)] pb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Editorial catalog
        </p>
        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-brand)] text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
          Open Source Catalog of Apps and Tools - curated with love and care
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--foreground-muted)]">
          {SITE.name} is curated by FLOSSK. It highlights genuinely open, actively
          maintained tools with clear documentation and real-world adoption.
          Search, filter, compare, and read why each entry belongs here—not an
          exhaustive directory.
        </p>
        <p className="mt-5 text-base">
          <Link
            href="/browse"
            className="inline-flex flex-wrap items-baseline gap-x-1.5 rounded-md text-[var(--foreground)] outline-none ring-[var(--ring)] transition-colors hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <span className="font-[family-name:var(--font-brand)] text-2xl font-semibold tabular-nums tracking-tight">
              {toolCount.toLocaleString("en-US")}
            </span>
            <span className="text-[var(--foreground-muted)]">
              open source apps and tools
            </span>
          </Link>
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            href="/browse"
            variant="primary"
            className="!px-6 !py-3 !bg-[#fff200]/95 !text-[var(--foreground)] !shadow-sm hover:!bg-[#e0cd00]/95 hover:!text-[var(--foreground)] dark:!bg-[#fff200]/35 dark:!text-[var(--foreground-muted)] dark:hover:!bg-[#fff200]/55 dark:hover:!text-[var(--foreground)]"
          >
            Browse all tools
          </Button>
          <Button href="/categories" variant="secondary" className="!px-6 !py-3">
            View categories
          </Button>
        </div>
      </section>

      <section className="py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-brand)] text-2xl font-semibold text-[var(--foreground)]">
              Top picks
            </h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Strong defaults in their categories—balanced quality, maintenance,
              and usefulness.
            </p>
          </div>
          <Link
            href="/browse"
            className="text-sm font-medium text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            Full browse →
          </Link>
        </div>
        <ToolResultsView tools={picks} className="mt-8" />
      </section>

      {featuredLists.length > 0 ? (
        <section className="border-t border-[var(--border)] py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-brand)] text-2xl font-semibold text-[var(--foreground)]">
                Featured lists
              </h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Editor-curated collections from the CMS—privacy picks, beginner
                sets, and more.
              </p>
            </div>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {featuredLists.map((list) => (
              <li key={list.slug}>
                <Link
                  href={`/collections/${list.slug}`}
                  className="group block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                >
                  <p className="inline-flex rounded-md border border-[#fff200]/55 bg-[#fff200]/50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#14120f]">
                    Collection
                  </p>
                  <p className="mt-2 inline font-[family-name:var(--font-brand)] text-lg font-semibold text-[var(--foreground)] rounded px-0.5 py-px transition-colors group-hover:bg-[#fff200]/50 group-hover:text-[#14120f]">
                    {list.name}
                  </p>
                  {list.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground-muted)]">
                      {list.description}
                    </p>
                  ) : null}
                  <p className="mt-4 text-sm font-medium text-[var(--foreground-muted)] transition-colors group-hover:text-[#14120f]">
                    View list →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-t border-[var(--border)] py-14">
        <h2 className="font-[family-name:var(--font-brand)] text-2xl font-semibold text-[var(--foreground)]">
          Browse by category
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--foreground-muted)]">
          Practical groupings from operating systems and browsers to databases,
          monitoring, and education—each with multiple vetted entries where the
          ecosystem supports it.
        </p>
        <CategoryResultsView categories={categoryPreview} className="mt-8" />
        <p className="mt-8 text-center">
          <Button href="/categories" variant="secondary">
            All categories
          </Button>
        </p>
      </section>
    </>
  );
}
