import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getToolBySlug, withCategory } from "@/lib/catalog";
import { maintenanceLabel, maturityLabel } from "@/lib/format";
import { absoluteUrl, getTwitterCreator, getTwitterSite, SITE } from "@/lib/seo/site";

const compareDesc =
  "Side-by-side comparison of curated open source tools: license, maturity, maintenance, platforms, strengths, limitations, and editorial notes. Verify licenses on official sites before compliance decisions.";

export const metadata: Metadata = {
  title: "Compare tools",
  description: compareDesc,
  alternates: {
    canonical: "/compare",
    languages: { en: absoluteUrl("/compare") },
  },
  openGraph: {
    title: `Compare tools · ${SITE.name}`,
    description: compareDesc,
    type: "website",
    url: absoluteUrl("/compare"),
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
    title: `Compare tools · ${SITE.name}`,
    description: compareDesc,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

type Props = {
  searchParams: Promise<{ ids?: string }>;
};

const FIELDS = [
  { key: "summary", label: "Summary" },
  { key: "whyIncluded", label: "Why included" },
  { key: "bestFor", label: "Best for" },
  { key: "license", label: "License" },
  { key: "maturity", label: "Maturity" },
  { key: "maintenanceStatus", label: "Maintenance" },
] as const;

export default async function ComparePage({ searchParams }: Props) {
  const sp = await searchParams;
  const ids = (sp.ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length < 2) {
    return (
      <div className="max-w-xl">
        <h1 className="font-[family-name:var(--font-brand)] text-3xl font-semibold text-[var(--foreground)]">
          Compare tools
        </h1>
        <p className="mt-4 text-[var(--foreground-muted)]">
          Add at least two tools from browse or tool pages using{" "}
          <strong className="text-[var(--foreground)]">Compare</strong>, then open
          this page from the bar. Or pass{" "}
          <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-sm">
            ?ids=firefox,debian,nginx
          </code>{" "}
          in the URL (comma-separated slugs).
        </p>
        <p className="mt-6">
          <Link
            href="/browse"
            className="font-medium text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
          >
            Go to browse →
          </Link>
        </p>
      </div>
    );
  }

  const tools = (
    await Promise.all(ids.map((id) => getToolBySlug(id)))
  ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getToolBySlug>>>[];

  if (tools.length !== ids.length) notFound();

  const enriched = (
    await Promise.all(tools.map((t) => withCategory(t)))
  ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof withCategory>>>[];

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-brand)] text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
          Compare {enriched.length} tools
        </h1>
        <p className="mt-3 text-[var(--foreground-muted)]">
          Editorial fields side by side. Verify licenses on official sites before
          compliance decisions.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
              <th scope="col" className="p-4 font-semibold text-[var(--foreground)]">
                Field
              </th>
              {enriched.map((t) => (
                <th
                  key={t.slug}
                  scope="col"
                  className="p-4 font-semibold text-[var(--foreground)]"
                >
                  <Link
                    href={`/tools/${t.slug}`}
                    className="font-[family-name:var(--font-brand)] text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                  >
                    {t.name}
                  </Link>
                  <p className="mt-1 text-xs font-normal text-[var(--foreground-muted)]">
                    {t.category.name}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELDS.map((row) => (
              <tr key={row.key} className="border-b border-[var(--border)] align-top">
                <th
                  scope="row"
                  className="p-4 font-medium text-[var(--foreground-muted)]"
                >
                  {row.label}
                </th>
                {enriched.map((t) => (
                  <td key={t.slug} className="p-4 text-[var(--foreground)]">
                    {row.key === "maturity"
                      ? maturityLabel(t.maturity)
                      : row.key === "maintenanceStatus"
                        ? maintenanceLabel(t.maintenanceStatus)
                        : String(t[row.key])}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-[var(--border)] align-top">
              <th scope="row" className="p-4 font-medium text-[var(--foreground-muted)]">
                Platforms
              </th>
              {enriched.map((t) => (
                <td key={t.slug} className="p-4 text-[var(--foreground)]">
                  {t.platforms.join(", ")}
                </td>
              ))}
            </tr>
            <tr className="align-top">
              <th scope="row" className="p-4 font-medium text-[var(--foreground-muted)]">
                Strengths
              </th>
              {enriched.map((t) => (
                <td key={t.slug} className="p-4 text-[var(--foreground)]">
                  <ul className="list-inside list-disc space-y-1">
                    {t.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr className="align-top">
              <th scope="row" className="p-4 font-medium text-[var(--foreground-muted)]">
                Limitations
              </th>
              {enriched.map((t) => (
                <td key={t.slug} className="p-4 text-[var(--foreground)]">
                  <ul className="list-inside list-disc space-y-1">
                    {t.limitations.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
