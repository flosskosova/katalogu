import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  SITE,
  SITE_ATTRIBUTION_LINE,
  SITE_SOURCE_LICENSE_LABEL,
  SITE_SOURCE_LICENSE_URL,
} from "@/lib/seo/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--muted)]/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8">
          <div className="w-full text-sm">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 sm:grid sm:grid-cols-4 sm:items-baseline sm:gap-x-8 sm:gap-y-0">
              <p className="shrink-0 font-medium text-[var(--foreground)]">
                Explore
              </p>
              <Link
                className="text-[var(--foreground-muted)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                href="/browse"
              >
                Browse &amp; filter
              </Link>
              <Link
                className="text-[var(--foreground-muted)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                href="/categories"
              >
                Categories
              </Link>
              <Link
                className="text-[var(--foreground-muted)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                href="/compare"
              >
                Compare tools
              </Link>
            </div>
          </div>

          <div className="flex gap-3">
            <BrandLogo className="h-10 w-10 shrink-0" />
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
                {SITE.name}
              </p>
              <p className="mt-1 text-xs font-medium leading-snug text-[var(--foreground-muted)]">
                {SITE_ATTRIBUTION_LINE}
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--foreground-muted)]">
                A curated, editorial catalog of trustworthy Free and Open Source
                Software—maintained for clarity, not completeness.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-[var(--foreground-subtle)]">
          <a
            className="underline decoration-[var(--border)] underline-offset-2 transition-colors hover:text-[var(--foreground-muted)] hover:decoration-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            href={SITE_SOURCE_LICENSE_URL}
            rel="license noopener noreferrer"
            target="_blank"
          >
            {SITE_SOURCE_LICENSE_LABEL}
          </a>{" "}
          — source code for this site. Catalog entries refer to third-party
          projects; their licenses vary. Project health and licensing change—verify
          on official sites before production adoption. Not legal advice.
        </p>
      </div>
    </footer>
  );
}
