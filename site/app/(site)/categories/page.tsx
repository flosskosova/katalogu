import type { Metadata } from "next";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { getCategories } from "@/lib/catalog";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";

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
  const categories = await getCategories();
  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Categories
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--foreground-muted)]">
          Each category includes an editorial summary and hand-picked tools that
          meet our inclusion bar: open license, real maintenance, and practical
          usefulness.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <CategoryCard key={c.slug} category={c} />
        ))}
      </div>
    </div>
  );
}
