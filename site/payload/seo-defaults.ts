/**
 * Default SEO fields for catalog tools & categories (hooks + seed + backfill).
 * Merges originalDoc + incoming data when reading so partial Payload updates still work.
 */

import { CATEGORY_SEO_OVERRIDES } from "../data/seo-overrides/categories";
import { TOOL_SEO_OVERRIDES } from "../data/seo-overrides/tools";

const DEFAULT_BRAND = "OpenCatalog";

export function seoBrand(): string {
  return process.env.NEXT_PUBLIC_SITE_NAME?.trim() || DEFAULT_BRAND;
}

export function truncateMetaDescription(text: string, max = 158): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function getToolSeoOverride(slug: string): {
  seoTitle?: string;
  seoDescription?: string;
} {
  return TOOL_SEO_OVERRIDES[slug] ?? {};
}

export function getCategorySeoOverride(slug: string): {
  seoTitle?: string;
  seoDescription?: string;
} {
  return CATEGORY_SEO_OVERRIDES[slug] ?? {};
}

/** ≤~58 chars for titles; truncates long product names. */
export function buildToolSeoTitle(name: string): string {
  return fitTitleWithBrand(name, "open source", seoBrand(), 58);
}

export function buildCategorySeoTitle(name: string): string {
  return fitTitleWithBrand(name, "open source tools", seoBrand(), 58);
}

function fitTitleWithBrand(
  name: string,
  segment: string,
  brand: string,
  max: number,
): string {
  const sep = " · ";
  const mid = ` — ${segment}`;
  let candidate = `${name}${mid}${sep}${brand}`;
  if (candidate.length <= max) return candidate;
  candidate = `${name}${sep}${brand}`;
  if (candidate.length <= max) return candidate;
  const suffix = `${sep}${brand}`;
  const room = max - suffix.length - 1;
  const head = name.slice(0, Math.max(8, room));
  return `${head}…${suffix}`;
}

/**
 * Meta description tuned for SERP + answer engines: summary, category, merit line, license, brand.
 */
export function buildRichToolSeoDescription(input: {
  summary: string;
  whyIncluded?: string;
  license?: string;
  categoryName?: string;
}): string {
  const brand = seoBrand();
  const sum = input.summary.replace(/\s+/g, " ").trim();
  const why = (input.whyIncluded ?? "").replace(/\s+/g, " ").trim();
  const lic = (input.license ?? "").replace(/\s+/g, " ").trim();
  const licShort = lic.length > 44 ? `${lic.slice(0, 41).trimEnd()}…` : lic;
  const whyShort = why.length > 70 ? `${why.slice(0, 67).trimEnd()}…` : why;
  const cat = (input.categoryName ?? "").trim();
  const pieces: string[] = [sum];
  if (cat) pieces.push(cat);
  if (whyShort) pieces.push(whyShort);
  if (licShort) pieces.push(licShort);
  const joined = pieces.join(" · ");
  return truncateMetaDescription(`${joined} · ${brand}`, 158);
}

/** Category meta: card summary + clipped editorial intro + brand (AI/SERP friendly). */
export function buildRichCategorySeoDescription(input: {
  summary: string;
  description?: string;
}): string {
  const brand = seoBrand();
  const sum = input.summary.replace(/\s+/g, " ").trim();
  const long = (input.description ?? "").replace(/\s+/g, " ").trim();
  const longShort =
    long.length > 88 ? `${long.slice(0, 85).trimEnd()}…` : long;
  const parts = [sum];
  if (longShort) parts.push(longShort);
  const core = parts.join(" ");
  return truncateMetaDescription(
    `${core} Curated FOSS tools · ${brand}.`,
    158,
  );
}

function relationPresent(v: unknown): boolean {
  if (v == null || v === "") return false;
  if (typeof v === "number") return true;
  if (typeof v === "string") return v.length > 0;
  if (typeof v === "object" && v !== null && "id" in v)
    return (v as { id?: unknown }).id != null;
  return true;
}

type Doc = Record<string, unknown>;

function mergedDoc(data: Doc, originalDoc?: Doc | null): Doc {
  return { ...(originalDoc ?? {}), ...data };
}

/** Mutates `data` with merged originals; call from beforeChange. */
export function applyToolSeoDefaults(
  data: Doc,
  originalDoc?: Doc | null,
): void {
  const m = mergedDoc(data, originalDoc);
  const name = String(m.name ?? "").trim();
  const slug = String(m.slug ?? "").trim();
  const summary = String(m.summary ?? "").trim();
  const whyIncluded = String(m.whyIncluded ?? "").trim();
  const license = String(m.license ?? "").trim();
  const prevSlug = String(originalDoc?.slug ?? "").trim();

  const override = getToolSeoOverride(slug);

  if (!String(m.seoTitle ?? "").trim() && name) {
    data.seoTitle = override.seoTitle ?? buildToolSeoTitle(name);
  }

  if (!String(m.seoDescription ?? "").trim() && (summary || whyIncluded)) {
    const desc =
      override.seoDescription ??
      buildRichToolSeoDescription({
        summary: summary || `${name} — open-source software.`,
        whyIncluded,
        license,
      });
    data.seoDescription = truncateMetaDescription(desc, 158);
  }

  const canon = String(m.canonicalSlug ?? "").trim();
  if (!canon && slug) {
    data.canonicalSlug = slug;
  } else if (
    slug &&
    prevSlug &&
    slug !== prevSlug &&
    canon === prevSlug
  ) {
    data.canonicalSlug = slug;
  }

  const hasOg = relationPresent(m.ogImage);
  const logo = m.logo;
  if (!hasOg && relationPresent(logo)) {
    data.ogImage = data.logo ?? originalDoc?.logo;
  }
}

export function applyCategorySeoDefaults(
  data: Doc,
  originalDoc?: Doc | null,
): void {
  const m = mergedDoc(data, originalDoc);
  const name = String(m.name ?? "").trim();
  const summary = String(m.summary ?? "").trim();
  const description = String(m.description ?? "").trim();
  const slug = String(m.slug ?? "").trim();
  const prevSlug = String(originalDoc?.slug ?? "").trim();
  const override = getCategorySeoOverride(slug);

  if (!String(m.seoTitle ?? "").trim() && name) {
    data.seoTitle = override.seoTitle ?? buildCategorySeoTitle(name);
  }

  if (
    !String(m.seoDescription ?? "").trim() &&
    (summary || description || override.seoDescription)
  ) {
    const desc =
      override.seoDescription ??
      buildRichCategorySeoDescription({
        summary: summary || `${name} — open source software category.`,
        description,
      });
    data.seoDescription = truncateMetaDescription(desc, 158);
  }

  const canon = String(m.canonicalSlug ?? "").trim();
  if (!canon && slug) {
    data.canonicalSlug = slug;
  } else if (
    slug &&
    prevSlug &&
    slug !== prevSlug &&
    canon === prevSlug
  ) {
    data.canonicalSlug = slug;
  }

  const hasOg = relationPresent(m.ogImage);
  const icon = m.icon;
  if (!hasOg && relationPresent(icon)) {
    data.ogImage = data.icon ?? originalDoc?.icon;
  }
}

export type StaticToolSeoInput = {
  name: string;
  slug: string;
  summary: string;
  whyIncluded?: string;
  license?: string;
};

export function toolSeoPatchFromStatic(tool: StaticToolSeoInput): Record<string, unknown> {
  const override = getToolSeoOverride(tool.slug);
  return {
    seoTitle: override.seoTitle ?? buildToolSeoTitle(tool.name),
    seoDescription: truncateMetaDescription(
      override.seoDescription ??
        buildRichToolSeoDescription({
          summary: tool.summary,
          whyIncluded: tool.whyIncluded,
          license: tool.license,
        }),
      158,
    ),
    canonicalSlug: tool.slug,
  };
}

export function categorySeoPatchFromStatic(cat: {
  name: string;
  slug: string;
  summary: string;
  description?: string;
}): Record<string, unknown> {
  const override = getCategorySeoOverride(cat.slug);
  return {
    seoTitle: override.seoTitle ?? buildCategorySeoTitle(cat.name),
    seoDescription: truncateMetaDescription(
      override.seoDescription ??
        buildRichCategorySeoDescription({
          summary: cat.summary,
          description: cat.description,
        }),
      158,
    ),
    canonicalSlug: cat.slug,
  };
}

/** Payload document → full SEO patch (for backfill jobs). */
export function computeToolSeoPatchFromPayloadDoc(
  doc: Record<string, unknown>,
  categoryName?: string,
): Record<string, unknown> {
  const slug = String(doc.slug ?? "");
  const name = String(doc.name ?? "");
  const summary = String(doc.summary ?? "");
  const whyIncluded = String(doc.whyIncluded ?? "");
  const license = String(doc.license ?? "");
  const override = getToolSeoOverride(slug);

  const patch: Record<string, unknown> = {
    seoTitle: override.seoTitle ?? buildToolSeoTitle(name),
    seoDescription: truncateMetaDescription(
      override.seoDescription ??
        buildRichToolSeoDescription({
          summary: summary || `${name} — open-source software.`,
          whyIncluded,
          license,
          categoryName,
        }),
      158,
    ),
    canonicalSlug: slug,
  };

  if (!relationPresent(doc.ogImage) && relationPresent(doc.logo)) {
    patch.ogImage = doc.logo;
  }

  return patch;
}

/** Payload category document → full SEO patch (for backfill jobs). */
export function computeCategorySeoPatchFromPayloadDoc(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  const slug = String(doc.slug ?? "");
  const name = String(doc.name ?? "");
  const summary = String(doc.summary ?? "");
  const description = String(doc.description ?? "");
  const override = getCategorySeoOverride(slug);

  const patch: Record<string, unknown> = {
    seoTitle: override.seoTitle ?? buildCategorySeoTitle(name),
    seoDescription: truncateMetaDescription(
      override.seoDescription ??
        buildRichCategorySeoDescription({
          summary: summary || `${name} — open source software category.`,
          description,
        }),
      158,
    ),
    canonicalSlug: slug,
  };

  if (!relationPresent(doc.ogImage) && relationPresent(doc.icon)) {
    patch.ogImage = doc.icon;
  }

  return patch;
}
