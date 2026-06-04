"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ViewModeToggle } from "@/components/catalog/ViewModeToggle";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/lib/seo/site";

const nav = [
  { href: "/browse", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/compare", label: "Compare" },
  { href: "/suggest", label: "Suggest FOSS" },
];

const linkClass =
  "rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] md:py-2";

export function SiteHeader() {
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const panelId = useId();
  const pathname = usePathname();
  const menuOpen = menuOpenPath === pathname;
  const closeMenu = useCallback(() => setMenuOpenPath(null), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-6 md:min-h-[5.25rem]">
        <Link
          href="/"
          className="group flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 md:flex-none md:max-w-[min(100%,20rem)]"
          onClick={closeMenu}
        >
          <BrandLogo
            className="h-16 w-auto max-h-16 shrink-0 self-center transition-opacity group-hover:opacity-90 sm:h-20 sm:max-h-20"
            priority
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-[family-name:var(--font-brand)] text-lg font-semibold tracking-tight sm:text-xl">
              {SITE.name}
            </span>
            <span className="mt-0.5 inline-block w-fit rounded-sm bg-[#fff200]/95 px-0.5 py-px font-[family-name:var(--font-brand)] text-[0.625rem] font-medium tracking-wide text-[var(--foreground)] [box-decoration-break:clone] dark:bg-[#fff200]/35 dark:text-[var(--foreground-muted)] sm:text-[0.6875rem]">
              curated by FLOSSK
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-0.5 md:flex md:gap-1"
        >
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ViewModeToggle className="hidden sm:inline-flex" />
          <ViewModeToggle variant="icon" className="sm:hidden" />
          <Button
            href="/suggest"
            variant="secondary"
            className="!hidden !px-3 !py-2 text-xs sm:!inline-flex sm:!px-4 sm:text-sm"
            onClick={closeMenu}
          >
            Suggest FOSS
          </Button>
          <Button
            href="/browse"
            variant="primary"
            className="!px-3 !py-2 text-xs sm:!px-4 sm:text-sm !bg-[#fff200]/95 !text-[var(--foreground)] !shadow-sm hover:!bg-[#e0cd00]/95 hover:!text-[var(--foreground)] dark:!bg-[#fff200]/35 dark:!text-[var(--foreground-muted)] dark:hover:!bg-[#fff200]/55 dark:hover:!text-[var(--foreground)]"
            onClick={closeMenu}
          >
            Explore
          </Button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] md:hidden"
            aria-expanded={menuOpen}
            aria-controls={panelId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() =>
              setMenuOpenPath((current) =>
                current === pathname ? null : pathname,
              )
            }
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 5h16" />
                <path d="M4 12h16" />
                <path d="M4 19h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id={panelId}
          className="border-t border-[var(--border)] bg-[var(--background)] md:hidden"
        >
          <nav
            aria-label="Primary mobile"
            className="mx-auto flex max-w-6xl flex-col px-4 py-2 pb-3 sm:px-6"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-[var(--border)] pt-3">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
                View as
              </p>
              <div className="px-3">
                <ViewModeToggle />
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
