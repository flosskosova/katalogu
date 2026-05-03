import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/catalog/JsonLd";
import { ToolCompareToggle } from "@/components/catalog/ToolCompareToggle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getRelatedTools,
  getToolBySlug,
  withCategory,
} from "@/lib/catalog";
import { maintenanceLabel, maturityLabel } from "@/lib/format";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";
import { buildSoftwareApplicationJsonLd } from "@/lib/seo/structured-data";

type Props = { params: Promise<{ slug: string }> };

/**
 * Do not enumerate all tool slugs at build time — that forces thousands of static
 * pages and very slow Vercel builds. Pages are generated on first request, then cached (ISR).
 * Keep TTL short so admin edits show on the public tool page without waiting an hour.
 */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Tool" };
  const title = tool.seoTitle?.trim() || tool.name;
  const description =
    tool.seoDescription?.trim() || tool.summary;
  const canonicalSlug = tool.canonicalSlug?.trim() || tool.slug;
  const path = `/tools/${canonicalSlug}`;
  const pageUrl = absoluteUrl(path);
  const ogImages = tool.ogImageUrl
    ? [{ url: tool.ogImageUrl, width: 1200, height: 630, alt: tool.name }]
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
    alternates: {
      canonical: path,
      languages: { en: pageUrl },
    },
    openGraph: {
      title,
      description,
      type: "article",
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
    keywords: tool.tags,
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();
  const wc = await withCategory(tool);
  if (!wc) notFound();

  const related = await getRelatedTools(tool, 6);

  return (
    <article>
      <JsonLd data={buildSoftwareApplicationJsonLd(tool, wc.category)} />
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--foreground-muted)]">
        <Link href="/browse" className="hover:text-[var(--accent)]">
          Browse
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <Link
          href={`/categories/${wc.category.slug}`}
          className="hover:text-[var(--accent)]"
        >
          {wc.category.name}
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-[var(--foreground)]">{tool.name}</span>
      </nav>

      <header className="mt-8 border-b border-[var(--border)] pb-10">
        <Badge tone="accent" href={`/categories/${wc.category.slug}`}>
          {wc.category.name}
        </Badge>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
          {tool.logoUrl ? (
            <Image
              src={tool.logoUrl}
              alt={`${tool.name} logo`}
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--muted)] object-contain p-2"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="font-[family-name:var(--font-brand)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
              {tool.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--foreground-muted)]">
              {tool.summary}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            href={tool.officialSite}
            variant="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Official site
          </Button>
          <Button
            href={tool.sourceRepo}
            variant="secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source repository
          </Button>
          {tool.docsUrl ? (
            <Button
              href={tool.docsUrl}
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </Button>
          ) : null}
          <ToolCompareToggle slug={tool.slug} name={tool.name} />
        </div>
      </header>

      <section className="grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          {tool.longDescription ? (
            <section aria-labelledby="long-heading">
              <h2
                id="long-heading"
                className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
              >
                Overview
              </h2>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-[var(--foreground-muted)]">
                {tool.longDescription}
              </p>
            </section>
          ) : null}

          {tool.galleryUrls && tool.galleryUrls.length > 0 ? (
            <section aria-labelledby="gallery-heading">
              <h2
                id="gallery-heading"
                className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
              >
                Screenshots
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {tool.galleryUrls.map((src) => (
                  <li key={src}>
                    <Image
                      src={src}
                      alt={`${tool.name} screenshot`}
                      width={1200}
                      height={675}
                      unoptimized
                      className="h-auto w-full rounded-xl border border-[var(--border)] object-cover"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="why-heading">
            <h2
              id="why-heading"
              className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
            >
              Why it is included
            </h2>
            <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
              {tool.whyIncluded}
            </p>
          </section>

          <section aria-labelledby="best-heading">
            <h2
              id="best-heading"
              className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
            >
              Best for
            </h2>
            <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
              {tool.bestFor}
            </p>
          </section>

          {tool.replacesProprietary ? (
            <section aria-labelledby="proprietary-heading">
              <h2
                id="proprietary-heading"
                className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
              >
                If you use Windows, Mac, or paid tools
              </h2>
              <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
                {tool.replacesProprietary}
              </p>
            </section>
          ) : null}

          {tool.targetUsers ? (
            <section aria-labelledby="tu-heading">
              <h2
                id="tu-heading"
                className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
              >
                Target users
              </h2>
              <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
                {tool.targetUsers}
              </p>
            </section>
          ) : null}

          <section aria-labelledby="str-heading">
            <h2
              id="str-heading"
              className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
            >
              Strengths
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-[var(--foreground-muted)]">
              {tool.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="lim-heading">
            <h2
              id="lim-heading"
              className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
            >
              Limitations
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-[var(--foreground-muted)]">
              {tool.limitations.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="alt-heading">
            <h2
              id="alt-heading"
              className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]"
            >
              Good alternatives
            </h2>
            <p className="mt-3 text-[var(--foreground-muted)]">
              {tool.alternatives.join(" · ")}
            </p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="font-[family-name:var(--font-brand)] text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
              At a glance
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--foreground-subtle)]">License</dt>
                <dd className="mt-0.5 text-[var(--foreground)]">{tool.license}</dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-subtle)]">Maturity</dt>
                <dd className="mt-0.5 text-[var(--foreground)]">
                  {maturityLabel(tool.maturity)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-subtle)]">Maintenance</dt>
                <dd className="mt-0.5 text-[var(--foreground)]">
                  {maintenanceLabel(tool.maintenanceStatus)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="font-[family-name:var(--font-brand)] text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
              Platforms
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {tool.platforms.map((p) => (
                <li key={p}>
                  <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs font-medium text-[var(--foreground)]">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="font-[family-name:var(--font-brand)] text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
              Tags
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/browse?tags=${encodeURIComponent(tag)}`}
                    className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="border-t border-[var(--border)] py-12" aria-labelledby="rel-heading">
        <h2
          id="rel-heading"
          className="font-[family-name:var(--font-brand)] text-2xl font-semibold text-[var(--foreground)]"
        >
          Related tools
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/tools/${r.slug}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
              >
                <p className="text-xs font-medium text-[var(--accent)]">
                  {r.category.name}
                </p>
                <p className="mt-1 font-[family-name:var(--font-brand)] font-medium text-[var(--foreground)]">
                  {r.name}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground-muted)]">
                  {r.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
