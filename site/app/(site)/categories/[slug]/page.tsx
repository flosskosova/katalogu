import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/catalog/JsonLd";
import { ToolCard } from "@/components/catalog/ToolCard";
import {
  getCategoryBySlug,
  getToolsByCategory,
} from "@/lib/catalog";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";
import { buildCollectionPageJsonLd } from "@/lib/seo/structured-data";

type Props = { params: Promise<{ slug: string }> };

/** On-demand + ISR — avoids pre-rendering every category at build. */
/** ISR — short TTL so catalog edits from admin propagate to category pages quickly. */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Category" };
  const path = `/categories/${cat.canonicalSlug?.trim() || cat.slug}`;
  const pageUrl = absoluteUrl(path);
  const title =
    cat.seoTitle?.trim() || `${cat.name} — open source tools · ${SITE.name}`;
  const description =
    cat.seoDescription?.trim() ||
    (cat.summary.length >= 80
      ? cat.summary
      : `${cat.name}: ${cat.summary} ${cat.description}`
          .replace(/\s+/g, " ")
          .slice(0, 158)
          .trim());
  const ogImages = cat.ogImageUrl
    ? [{ url: cat.ogImageUrl, width: 1200, height: 630, alt: cat.name }]
    : [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: SITE.name,
        },
      ];
  return {
    title,
    description,
    alternates: { canonical: path, languages: { en: pageUrl } },
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      siteName: SITE.name,
      locale: SITE.locale,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      site: getTwitterSite(),
      creator: getTwitterCreator(),
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const tools = await getToolsByCategory(slug);

  return (
    <div>
      <JsonLd data={buildCollectionPageJsonLd(cat, tools)} />
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--foreground-muted)]">
        <Link href="/categories" className="hover:text-[var(--accent)]">
          Categories
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-[var(--foreground)]">{cat.name}</span>
      </nav>

      <header className="mt-6 border-b border-[var(--border)] pb-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {cat.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-[var(--foreground-muted)]">
          {cat.description}
        </p>
      </header>

      <section className="py-10">
        <h2 className="font-[family-name:var(--font-brand)] text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
          Tools in this category ({tools.length})
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
        {tools.length === 0 ? (
          <p className="mt-8 text-[var(--foreground-muted)]">
            No tools seeded for this category yet—check back as the catalog
            grows.
          </p>
        ) : null}
      </section>
    </div>
  );
}
