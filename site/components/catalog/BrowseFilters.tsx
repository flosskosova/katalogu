"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  categories: Category[];
  platformOptions: string[];
  tagOptions: string[];
  className?: string;
};

export function BrowseFilters({
  categories,
  platformOptions,
  tagOptions,
  className,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const platforms = platformOptions;
  const tags = useMemo(() => tagOptions.slice(0, 60), [tagOptions]);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      startTransition(() => {
        router.push(`/browse?${next.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const q = searchParams.get("q") ?? "";
  const [qInput, setQInput] = useState(q);
  useEffect(() => {
    setQInput(q);
  }, [q]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const cur =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("q") ?? ""
          : "";
      const next = qInput.trim();
      if (next === cur) return;
      setParam({ q: next || null });
    }, 380);
    return () => window.clearTimeout(t);
  }, [qInput, setParam]);

  const category = searchParams.get("category") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const license = searchParams.get("license") ?? "";
  const privacy = searchParams.get("privacy") === "1";
  const selfHosted = searchParams.get("selfHosted") === "1";
  const beginner = searchParams.get("beginner") === "1";
  const maturity = searchParams.get("maturity") ?? "";
  const maintenance = searchParams.get("maintenance") ?? "";
  const tagFilter = searchParams.get("tags") ?? "";

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="search-q" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Search
          </label>
          <input
            id="search-q"
            type="search"
            value={qInput}
            placeholder="Name, tag, use case…"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:outline focus:outline-2 focus:outline-[var(--ring)]"
            onChange={(e) => setQInput(e.target.value)}
          />
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="search-cat" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Category
          </label>
          <select
            id="search-cat"
            value={category}
            onChange={(e) =>
              setParam({ category: e.target.value || null })
            }
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline focus:outline-2 focus:outline-[var(--ring)]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label htmlFor="search-plat" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Platform
          </label>
          <select
            id="search-plat"
            value={platform}
            onChange={(e) =>
              setParam({ platform: e.target.value || null })
            }
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline focus:outline-2 focus:outline-[var(--ring)]"
          >
            <option value="">Any</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="search-lic" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            License contains
          </label>
          <input
            id="search-lic"
            type="text"
            value={license}
            onChange={(e) => setParam({ license: e.target.value || null })}
            placeholder="MIT, GPL, Apache…"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline focus:outline-2 focus:outline-[var(--ring)]"
          />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Facets
          </span>
          <fieldset className="mt-2 flex flex-wrap gap-3">
            <legend className="sr-only">Tool facets</legend>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) =>
                  setParam({ privacy: e.target.checked ? "1" : null })
                }
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--ring)]"
              />
              Privacy-focused
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selfHosted}
                onChange={(e) =>
                  setParam({ selfHosted: e.target.checked ? "1" : null })
                }
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--ring)]"
              />
              Self-hosted
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={beginner}
                onChange={(e) =>
                  setParam({ beginner: e.target.checked ? "1" : null })
                }
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--ring)]"
              />
              Beginner-friendly
            </label>
          </fieldset>
        </div>
        <div>
          <label htmlFor="search-mat" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Maturity
          </label>
          <select
            id="search-mat"
            value={maturity}
            onChange={(e) =>
              setParam({ maturity: e.target.value || null })
            }
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline focus:outline-2 focus:outline-[var(--ring)]"
          >
            <option value="">Any</option>
            <option value="experimental">Experimental</option>
            <option value="growing">Growing</option>
            <option value="established">Established</option>
            <option value="industry-standard">Industry standard</option>
          </select>
        </div>
        <div>
          <label htmlFor="search-maint" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Maintenance
          </label>
          <select
            id="search-maint"
            value={maintenance}
            onChange={(e) =>
              setParam({ maintenance: e.target.value || null })
            }
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline focus:outline-2 focus:outline-[var(--ring)]"
          >
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="slow">Slow</option>
            <option value="maintenance">Maintenance mode</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="search-tags" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Tag
          </label>
          <select
            id="search-tags"
            value={tagFilter}
            onChange={(e) => setParam({ tags: e.target.value || null })}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline focus:outline-2 focus:outline-[var(--ring)]"
          >
            <option value="">Any tag</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          className="!text-sm"
          onClick={() => {
            startTransition(() => router.push("/browse"));
          }}
        >
          Reset filters
        </Button>
        {pending ? (
          <span className="text-xs text-[var(--foreground-muted)]">Updating…</span>
        ) : null}
      </div>
    </div>
  );
}
