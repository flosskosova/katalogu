import type {
  Category,
  CuratedCollectionView,
  Tool,
  ToolWithCategory,
} from "@/lib/types";
import { absolutePayloadUrl } from "@/lib/cms/media-url";
import { withProprietaryAlternativeNote } from "@/data/proprietary-alternatives";

function mediaUrl(m: unknown): string | undefined {
  if (m == null || typeof m !== "object") return undefined;
  const url = (m as { url?: string }).url;
  return absolutePayloadUrl(url);
}

export function mapCategoryDoc(doc: {
  id: string | number;
  name: string;
  slug: string;
  summary: string;
  description: string;
  visibleOnWebsite?: boolean | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalSlug?: string | null;
  ogImage?: unknown;
}): Category {
  const c: Category = {
    name: doc.name,
    slug: doc.slug,
    summary: doc.summary,
    description: doc.description,
  };
  if (doc.visibleOnWebsite === false) c.visibleOnWebsite = false;
  const seoTitle = String(doc.seoTitle ?? "").trim();
  const seoDescription = String(doc.seoDescription ?? "").trim();
  const canonicalSlug = String(doc.canonicalSlug ?? "").trim();
  if (seoTitle) c.seoTitle = seoTitle;
  if (seoDescription) c.seoDescription = seoDescription;
  if (canonicalSlug) c.canonicalSlug = canonicalSlug;
  const og = mediaUrl(doc.ogImage);
  if (og) c.ogImageUrl = og;
  return c;
}

export function mapToolDoc(
  doc: {
    id: string | number;
    name: string;
    slug: string;
    editorialWeight?: number | null;
    summary: string;
    longDescription?: string | null;
    whyIncluded?: string | null;
    bestFor?: string | null;
    targetUsers?: string | null;
    platforms?: { platform?: string | null; id?: string }[] | null;
    license: string;
    maintenanceStatus: Tool["maintenanceStatus"];
    maturity: Tool["maturity"];
    strengths?: { line?: string | null }[] | null;
    limitations?: { line?: string | null }[] | null;
    alternatives?: { line?: string | null }[] | null;
    replacesProprietary?: string | null;
    officialSite: string;
    sourceRepo: string;
    docsUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    canonicalSlug?: string | null;
    rank: Tool["rank"];
    privacyFocused?: boolean | null;
    selfHosted?: boolean | null;
    beginnerFriendly?: boolean | null;
    developerFocused?: boolean | null;
    endUserFocused?: boolean | null;
    featured?: boolean | null;
    category: unknown;
    relatedTools?: unknown;
    tagList?: { slug?: string; name?: string }[] | null;
    logo?: unknown;
    gallery?: unknown[] | null;
    ogImage?: unknown;
    visibleOnWebsite?: boolean | null;
  },
  categoryOverride?: Category,
): ToolWithCategory {
  const catRaw = doc.category as
    | {
        slug?: string;
        name?: string;
        summary?: string;
        description?: string;
        visibleOnWebsite?: boolean | null;
      }
    | string
    | number
    | null
    | undefined;

  let category: Category;
  if (categoryOverride) {
    category = categoryOverride;
  } else if (
    catRaw &&
    typeof catRaw === "object" &&
    "slug" in catRaw &&
    catRaw.slug
  ) {
    category = {
      slug: String(catRaw.slug),
      name: String(catRaw.name ?? catRaw.slug),
      summary: String(catRaw.summary ?? ""),
      description: String(catRaw.description ?? ""),
    };
    if (catRaw.visibleOnWebsite === false) {
      category.visibleOnWebsite = false;
    }
  } else {
    category = {
      slug: "uncategorized",
      name: "Uncategorized",
      summary: "",
      description: "",
    };
  }

  const rel = doc.relatedTools as
    | { slug?: string }[]
    | string[]
    | null
    | undefined;
  const relatedSlugs = Array.isArray(rel)
    ? rel
        .map((r) =>
          typeof r === "object" && r && "slug" in r ? String(r.slug) : "",
        )
        .filter(Boolean)
    : [];

  const tagsFromRel = (doc.tagList ?? [])
    .map((t) => {
      if (typeof t === "object" && t) {
        const name = String((t as { name?: string }).name ?? "").trim();
        if (name) return name;
        return String((t as { slug?: string }).slug ?? "").trim();
      }
      return "";
    })
    .filter(Boolean) as string[];

  const galleryUrls = Array.isArray(doc.gallery)
    ? (doc.gallery.map((g) => mediaUrl(g)).filter(Boolean) as string[])
    : [];

  const longDesc = String(doc.longDescription ?? "").trim();
  const docs = String(doc.docsUrl ?? "").trim();
  const targetUsers = String(doc.targetUsers ?? "").trim();
  const seoTitle = String(doc.seoTitle ?? "").trim();
  const seoDescription = String(doc.seoDescription ?? "").trim();
  const canonicalSlug = String(doc.canonicalSlug ?? "").trim();
  const replacesProprietary = String(doc.replacesProprietary ?? "").trim();

  const tool: Tool = {
    slug: doc.slug,
    name: doc.name,
    editorialWeight:
      typeof doc.editorialWeight === "number" ? doc.editorialWeight : 0,
    categorySlug: category.slug,
    summary: doc.summary,
    whyIncluded: doc.whyIncluded ?? "",
    bestFor: doc.bestFor ?? "",
    platforms: (doc.platforms ?? [])
      .map((p) => (p?.platform ?? "").trim())
      .filter(Boolean),
    license: doc.license,
    maintenanceStatus: doc.maintenanceStatus,
    maturity: doc.maturity,
    strengths: (doc.strengths ?? [])
      .map((s) => (s.line ?? "").trim())
      .filter(Boolean),
    limitations: (doc.limitations ?? [])
      .map((s) => (s.line ?? "").trim())
      .filter(Boolean),
    alternatives: (doc.alternatives ?? [])
      .map((s) => (s.line ?? "").trim())
      .filter(Boolean),
    officialSite: doc.officialSite,
    sourceRepo: doc.sourceRepo,
    tags: tagsFromRel.length ? tagsFromRel : inferTagsFromFlags(doc),
    rank: doc.rank,
    ...(doc.featured ? { homepageTopPick: true as const } : {}),
    privacyFocused: Boolean(doc.privacyFocused),
    selfHosted: Boolean(doc.selfHosted),
    beginnerFriendly: Boolean(doc.beginnerFriendly),
    relatedSlugs: relatedSlugs.length ? relatedSlugs : undefined,
  };

  if (doc.visibleOnWebsite === false) tool.visibleOnWebsite = false;

  if (longDesc) tool.longDescription = longDesc;
  if (docs) tool.docsUrl = docs;
  if (targetUsers) tool.targetUsers = targetUsers;
  if (seoTitle) tool.seoTitle = seoTitle;
  if (seoDescription) tool.seoDescription = seoDescription;
  if (canonicalSlug) tool.canonicalSlug = canonicalSlug;
  if (replacesProprietary) tool.replacesProprietary = replacesProprietary;

  const logoUrl = mediaUrl(doc.logo);
  if (logoUrl) tool.logoUrl = logoUrl;
  if (galleryUrls.length) tool.galleryUrls = galleryUrls;
  const og = mediaUrl(doc.ogImage);
  if (og) tool.ogImageUrl = og;

  if (doc.developerFocused) tool.tags = [...new Set([...tool.tags, "developer"])];
  if (doc.endUserFocused) tool.tags = [...new Set([...tool.tags, "end-user"])];

  const enriched = withProprietaryAlternativeNote(tool);
  return { ...enriched, category };
}

export function mapCuratedCollectionDoc(
  doc: Record<string, unknown>,
): CuratedCollectionView {
  const itemsRaw =
    (doc.items as
      | Array<{ tool?: unknown; sortOrder?: number; blurb?: string }>
      | undefined) ?? [];
  const sorted = [...itemsRaw].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const items = sorted.flatMap((row) => {
    const t = row.tool;
    if (!t || typeof t !== "object") return [];
    const twc = mapToolDoc(t as never, undefined);
    const blurb = String(row.blurb ?? "").trim();
    return [{ tool: twc, ...(blurb ? { blurb } : {}) }];
  });
  const seoTitle = String((doc as { seoTitle?: string }).seoTitle ?? "").trim();
  const seoDescription = String(
    (doc as { seoDescription?: string }).seoDescription ?? "",
  ).trim();
  const out: CuratedCollectionView = {
    slug: String(doc.slug ?? ""),
    name: String(doc.name ?? ""),
    description: String(doc.description ?? ""),
    displayStyle: String(doc.displayStyle ?? "grid"),
    items,
  };
  if (seoTitle) out.seoTitle = seoTitle;
  if (seoDescription) out.seoDescription = seoDescription;
  return out;
}

/** Drop tools hidden from the public site (or in a hidden category) from curated lists. */
export function filterCuratedCollectionForPublicSite(
  col: CuratedCollectionView,
): CuratedCollectionView {
  return {
    ...col,
    items: col.items.filter(
      (item) =>
        item.tool.visibleOnWebsite !== false &&
        item.tool.category.visibleOnWebsite !== false,
    ),
  };
}

function inferTagsFromFlags(doc: {
  privacyFocused?: boolean | null;
  selfHosted?: boolean | null;
  beginnerFriendly?: boolean | null;
}): string[] {
  const t: string[] = [];
  if (doc.privacyFocused) t.push("privacy");
  if (doc.selfHosted) t.push("self-hosted");
  if (doc.beginnerFriendly) t.push("beginner-friendly");
  return t;
}
