import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/lib/seo/site";

const nav = [
  { href: "/browse", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/compare", label: "Compare" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 text-[var(--foreground)]"
        >
          <BrandLogo
            className="h-9 w-9 shrink-0 self-center transition-opacity group-hover:opacity-90"
            priority
          />
          <span className="flex min-w-0 w-max max-w-[calc(100vw-8rem)] flex-col leading-tight">
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              {SITE.name}
            </span>
            <span className="mt-0.5 font-sans text-[0.625rem] font-medium tracking-wide text-[var(--foreground-muted)] sm:text-[0.6875rem]">
              curated by FLOSSK
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2 py-2 text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] sm:px-3 sm:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/browse" variant="primary" className="!px-4 !py-2 text-sm">
            Explore
          </Button>
        </div>
      </div>
    </header>
  );
}
