import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";
import { flosskHighlightLabel } from "@/lib/ui/flossk-highlight";
import { cn } from "@/lib/utils";

const sourcesTitle = `Catalog sources · ${SITE.name}`;
const sourcesDescription =
  "See the external datasets, directories, and lists used to discover candidates for the OpenCatalog.";

export const metadata: Metadata = {
  title: "Catalog sources",
  description: sourcesDescription,
  alternates: {
    canonical: "/sources",
    languages: { en: absoluteUrl("/sources") },
  },
  openGraph: {
    title: sourcesTitle,
    description: sourcesDescription,
    type: "website",
    url: absoluteUrl("/sources"),
    siteName: SITE.name,
    locale: SITE.locale,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    site: getTwitterSite(),
    creator: getTwitterCreator(),
    title: sourcesTitle,
    description: sourcesDescription,
    images: ["/opengraph-image"],
  },
};

const sources = [
  {
    name: "definitive-opensource",
    url: "https://github.com/mustbeperfect/definitive-opensource",
    detail:
      "Its canonical applications.json dataset is imported as a source of candidate applications. Entries are deduplicated and mapped into OpenCatalog categories before use.",
  },
  {
    name: "awesome-open-source-systems",
    url: "https://github.com/ishanvyas22/awesome-open-source-systems",
    detail:
      "Used as a discovery source for practical open-source systems across categories such as finance, analytics, infrastructure, and self-hosting.",
  },
  {
    name: "top-github-repos-list",
    url: "https://github.com/md8-habibullah/top-github-repos-list",
    detail:
      "Used to surface widely referenced GitHub projects. Candidates are filtered to match the catalog's scope and editorial criteria.",
  },
  {
    name: "SourceForge Open Source Directory",
    url: "https://sourceforge.net/directory/",
    detail:
      "Used as an additional discovery signal for established and widely distributed open-source software.",
  },
  {
    name: "Opensource.com",
    url: "https://opensource.com/",
    detail:
      "Used as a thematic discovery source for areas including enterprise Linux, desktop FOSS, Python and data tooling, self-hosting, and DevOps.",
  },
  {
    name: "Hugging Face Hub",
    url: "https://huggingface.co/models",
    detail:
      "Download and discovery signals from the Hub are used to identify notable open-weight text-generation models for editorial review.",
  },
  {
    name: "There's An AI For That — Repositories",
    url: "https://theresanaiforthat.com/repositories/",
    detail:
      "Used as a discovery source for open AI and machine-learning repositories, with duplicate and licensing checks before catalog inclusion.",
  },
] as const;

export default function SourcesPage() {
  return (
    <div className="space-y-14">
      <section className="border-b border-[var(--border)] pb-12">
        <p
          className={cn(
            flosskHighlightLabel,
            "text-xs uppercase tracking-[0.2em] sm:text-[0.6875rem]",
          )}
        >
          Transparency
        </p>
        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-brand)] text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
          Sources used to discover catalog candidates
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--foreground-muted)]">
          {SITE.name} combines direct editorial curation with external datasets,
          directories, and lists. These sources help discover candidates; they do not
          automatically determine what is included or how a project is evaluated.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {sources.map((source) => (
          <article
            key={source.name}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
          >
            <h2 className="font-[family-name:var(--font-brand)] text-xl font-semibold text-[var(--foreground)]">
              <a
                className="underline decoration-[var(--border)] underline-offset-4 transition-colors hover:decoration-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                href={source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {source.name}
              </a>
            </h2>
            <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
              {source.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-brand)] text-2xl font-semibold text-[var(--foreground)]">
          How these sources are used
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-[var(--foreground-muted)]">
          <p>
            External lists are discovery inputs, not automatic approvals. Entries may
            be deduplicated, re-categorized, excluded, or rewritten to match the
            catalog's editorial criteria.
          </p>
          <p>
            Many entries are also curated directly from official project websites and
            source repositories. Licensing, maintenance, security, and operational
            claims should still be verified against upstream sources before production
            adoption.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/about" variant="secondary">
            Read the methodology
          </Button>
          <Button href="/suggest" variant="highlight">
            Suggest a project
          </Button>
        </div>
      </section>
    </div>
  );
}
