import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/catalog/JsonLd";
import { ToolCard } from "@/components/catalog/ToolCard";
import {
  getCuratedCollectionBySlug,
  getPublishedCollectionSlugs,
} from "@/lib/catalog";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";
import { buildCuratedCollectionJsonLd } from "@/lib/seo/structured-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPublishedCollectionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCuratedCollectionBySlug(slug);
  if (!c) return { title: "Collection" };
  const path = `/collections/${c.slug}`;
  const pageUrl = absoluteUrl(path);
  const title = c.seoTitle?.trim() || `${c.name} · ${SITE.name}`;
  const description =
    c.seoDescription?.trim() ||
    c.description ||
    `${c.name}: curated open source software picks on ${SITE.name}.`;
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
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CuratedCollectionPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCuratedCollectionBySlug(slug);
  if (!c) notFound();

  const gridClass =
    c.displayStyle === "list"
      ? "flex flex-col gap-6"
      : c.displayStyle === "compact"
        ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <article>
      <JsonLd data={buildCuratedCollectionJsonLd(c)} />
      <nav
        aria-label="Breadcrumb"
        className="text-sm text-[var(--foreground-muted)]"
      >
        <Link href="/browse" className="hover:text-[var(--accent)]">
          Browse
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-[var(--foreground)]">{c.name}</span>
      </nav>

      <header className="mt-8 border-b border-[var(--border)] pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Curated list
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {c.name}
        </h1>
        {c.description ? (
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--foreground-muted)]">
            {c.description}
          </p>
        ) : null}
      </header>

      <section className={`py-12 ${gridClass}`} aria-label="Tools in this list">
        {c.items.map(({ tool, blurb }) => (
          <div key={tool.slug} className="space-y-3">
            {blurb ? (
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                {blurb}
              </p>
            ) : null}
            <ToolCard tool={tool} />
          </div>
        ))}
      </section>
    </article>
  );
}
