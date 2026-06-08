import type { Metadata } from "next";
import { CategoryResultsView } from "@/components/catalog/CategoryResultsView";
import { ViewModeToggle } from "@/components/catalog/ViewModeToggle";
import { getCategoriesWithCounts } from "@/lib/catalog";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";

/** Skip SSG at build time — cold Postgres/Supabase pooler often exceeds Next’s per-page static budget on Vercel. */
export const dynamic = "force-dynamic";

const catDesc =
  "Explore curated free and open source software by practical category—from browsers and operating systems to databases, monitoring, education, and design.";

export const metadata: Metadata = {
  title: "Categories",
  description: catDesc,
  keywords: [...SITE.keywords, "software categories", "FOSS by category"],
  alternates: {
    canonical: "/categories",
    languages: { en: absoluteUrl("/categories") },
  },
  openGraph: {
    title: `Categories · ${SITE.name}`,
    description: catDesc,
    type: "website",
    url: absoluteUrl("/categories"),
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
    title: `Categories · ${SITE.name}`,
    description: catDesc,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();
  return (
    <div>
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-brand)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Categories
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--foreground-muted)]">
            Each category includes an editorial summary and hand-picked tools that
            meet our inclusion bar: open license, real maintenance, and practical
            usefulness.
          </p>
        </div>
        <ViewModeToggle />
      </header>
      <CategoryResultsView categories={categories} />
    </div>
  );
}
