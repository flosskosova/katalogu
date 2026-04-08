/**
 * Central site SEO / entity config for metadata and JSON-LD.
 * Override branding via env where noted.
 */

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Logo / favicon under `public/` (PNG with transparent background). */
export const SITE_LOGO_PATH = "/brand-logo.png" as const;

/** Public credit under the site name (header, footer). */
export const SITE_ATTRIBUTION_LINE =
  process.env.NEXT_PUBLIC_SITE_ATTRIBUTION?.trim() ||
  "A work of co-authorship by CyberFuzz & AI, powered by FLOSSK";

/** SPDX id for this repository’s source (see root `LICENSE`). */
export const SITE_SOURCE_LICENSE_SPDX = "GPL-2.0" as const;

/** Human-readable label + canonical license text URL (GNU). */
export const SITE_SOURCE_LICENSE_LABEL = "GNU GPL v2.0";
export const SITE_SOURCE_LICENSE_URL =
  process.env.NEXT_PUBLIC_SOURCE_LICENSE_URL?.trim() ||
  "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html";

export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "OpenCatalog",
  /** Short positioning line (title suffix, OG). */
  tagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    "Curated FOSS catalog",
  /** Primary meta description (~155–165 chars ideal; longer OK for OG). */
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Editorial catalog of trustworthy free and open source software—co-authored by CyberFuzz and AI, powered by FLOSSK. Browse by category, filter by platform and license, compare tools, and read evidence-based inclusion notes—not an exhaustive directory.",
  /** Default keywords for homepage / brand discovery (search + AI retrieval). */
  keywords: [
    "open source software",
    "FOSS",
    "FLOSS",
    "free software",
    "open source tools",
    "software catalog",
    "OSS",
    "curated software",
    "open source alternatives",
  ] as const,
  locale: "en_US",
  language: "en",
  /** ISO-like region focus for GEO / entity clarity (global catalog). */
  areaServed: "Worldwide" as const,
} as const;

export function parseSameAsUrls(): string[] {
  const raw = process.env.NEXT_PUBLIC_ORGANIZATION_SAME_AS?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((u): u is string => typeof u === "string" && u.length > 0);
    }
  } catch {
    /* plain list */
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getTwitterSite(): string | undefined {
  const h = process.env.NEXT_PUBLIC_TWITTER_SITE?.trim();
  return h ? (h.startsWith("@") ? h : `@${h}`) : undefined;
}

export function getTwitterCreator(): string | undefined {
  const h = process.env.NEXT_PUBLIC_TWITTER_CREATOR?.trim();
  return h ? (h.startsWith("@") ? h : `@${h}`) : undefined;
}

export function getOrganizationLegalName(): string {
  return process.env.NEXT_PUBLIC_ORGANIZATION_LEGAL_NAME?.trim() || SITE.name;
}

/** Google Search Console HTML tag content (optional). */
export function getGoogleSiteVerification(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;
}

export function orgId(): string {
  return `${getSiteUrl()}/#organization`;
}

export function websiteId(): string {
  return `${getSiteUrl()}/#website`;
}
