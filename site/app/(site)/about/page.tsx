import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";
import { flosskHighlightLabel } from "@/lib/ui/flossk-highlight";
import { cn } from "@/lib/utils";

const aboutTitle = `About the catalog · ${SITE.name}`;
const aboutDescription =
  "Learn how OpenCatalog is curated, which editorial criteria decide inclusion, what the catalog is for, and where its judgments should be verified against official project sources.";

export const metadata: Metadata = {
  title: "About the catalog",
  description: aboutDescription,
  alternates: {
    canonical: "/about",
    languages: { en: absoluteUrl("/about") },
  },
  openGraph: {
    title: aboutTitle,
    description: aboutDescription,
    type: "website",
    url: absoluteUrl("/about"),
    siteName: SITE.name,
    locale: SITE.locale,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    site: getTwitterSite(),
    creator: getTwitterCreator(),
    title: aboutTitle,
    description: aboutDescription,
    images: ["/opengraph-image"],
  },
};

const criteria = [
  "The project must be genuinely free and open source, not merely source-available marketing.",
  "It should show evidence of active or credible long-term maintenance.",
  "Documentation should be good enough for real-world adoption, not just demos.",
  "The tool should solve a practical problem clearly enough to justify editorial inclusion.",
  "Entries should explain both strengths and limitations so readers are not pushed toward blind adoption.",
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-14">
      <section className="border-b border-[var(--border)] pb-12">
        <p
          className={cn(
            flosskHighlightLabel,
            "text-xs uppercase tracking-[0.2em] sm:text-[0.6875rem]",
          )}
        >
          About
        </p>
        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-brand)] text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
          Editorial curation for trustworthy open source adoption
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--foreground-muted)]">
          {SITE.name} is not an exhaustive software directory. It is a curated catalog
          built to help people find credible Free and Open Source Software, compare
          practical options, and understand why a tool is worth considering.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/browse" variant="highlight" className="!px-6 !py-3">
            Browse the catalog
          </Button>
          <Button href="/suggest" variant="secondary" className="!px-6 !py-3">
            Suggest a tool
          </Button>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="space-y-10">
          <section>
            <h2 className="font-[family-name:var(--font-brand)] text-2xl font-semibold text-[var(--foreground)]">
              What this catalog is for
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-[var(--foreground-muted)]">
              <p>
                The goal is to reduce noise. Plenty of software lists treat every
                repository as equally relevant. This catalog does not. It favors
                practical adoption, credible maintenance, and clarity about trade-offs.
              </p>
              <p>
                That makes {SITE.name} more useful for researchers, students, NGOs,
                engineers, and organizations that want grounded open source options
                rather than raw volume.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-brand)] text-2xl font-semibold text-[var(--foreground)]">
              Editorial methodology
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--foreground-muted)]">
              Inclusion is based on editorial judgment, not automated scraping. Each
              listing is intended to justify itself with plain-language reasoning,
              not just popularity metrics.
            </p>
            <ul className="mt-5 list-inside list-disc space-y-3 text-[var(--foreground-muted)]">
              {criteria.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-brand)] text-2xl font-semibold text-[var(--foreground)]">
              How to read an entry
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-[var(--foreground-muted)]">
              <p>
                Tool pages are intentionally structured around practical decision-making:
                summary, why included, best for, strengths, limitations, alternatives,
                supported platforms, and official project links.
              </p>
              <p>
                The catalog is a starting point for evaluation, not a replacement for
                vendor or project documentation. Licensing, security, compliance, and
                operational fit should always be verified on the official project site
                before production use.
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="font-[family-name:var(--font-brand)] text-lg font-semibold text-[var(--foreground)]">
              Transparency
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
              <li>Entries are curated, not auto-approved.</li>
              <li>Comparisons are editorial and should be independently verified.</li>
              <li>The catalog prioritizes clarity over completeness.</li>
              <li>Project quality and licensing can change over time.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="font-[family-name:var(--font-brand)] text-lg font-semibold text-[var(--foreground)]">
              Contribute
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
              Know a trustworthy project that belongs here, or spot a correction that
              would improve a listing? Submit it for review.
            </p>
            <div className="mt-5">
              <Button href="/suggest" variant="secondary">
                Suggest a FOSS app
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
