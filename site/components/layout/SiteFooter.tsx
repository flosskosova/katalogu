import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { flosskTextLink } from "@/lib/ui/flossk-highlight";
import {
  SITE,
  SITE_SOURCE_LICENSE_LABEL,
  SITE_SOURCE_LICENSE_URL,
} from "@/lib/seo/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--muted)]/40 font-[family-name:var(--font-brand)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8">
          <div className="w-full text-sm">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <p className="shrink-0 font-medium text-[var(--foreground)]">
                Explore
              </p>
              <Link className={flosskTextLink} href="/browse">
                Browse &amp; filter
              </Link>
              <Link className={flosskTextLink} href="/categories">
                Categories
              </Link>
              <Link className={flosskTextLink} href="/compare">
                Compare tools
              </Link>
              <Link className={flosskTextLink} href="/suggest">
                Suggest a FOSS app
              </Link>
            </div>
          </div>

          <div className="flex gap-3">
            <BrandLogo className="h-[2.52rem] w-auto max-h-[2.52rem] shrink-0 sm:h-[2.88rem] sm:max-h-[2.88rem]" />
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {SITE.name}
              </p>
              <p className="mt-1 font-[family-name:var(--font-sans)] text-xs font-normal leading-snug text-[var(--foreground-muted)]">
                A work of co-authorship by{" "}
                <a
                  className="underline decoration-[var(--border)] underline-offset-2 transition-colors hover:text-[var(--foreground-muted)] hover:decoration-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                  href="https://www.linkedin.com/in/samikciku"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  @samikciku
                </a>{" "}
                &amp; AI, powered by FLOSSK
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--foreground-muted)]">
                A curated, editorial catalog of trustworthy Free and Open Source
                Software—maintained for clarity, not completeness.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-10 font-[family-name:var(--font-sans)] text-xs font-normal text-[var(--foreground-subtle)]">
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
