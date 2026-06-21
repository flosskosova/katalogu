import type { PayloadRequest } from "payload";
import { normalizeToCatalogToolSlug } from "../../lib/catalog-tool-slug";
import { slugify } from "../../lib/utils";
import { ACCEPT_SUGGESTION_CONTEXT } from "./acceptToolSuggestion";
import { toolSeoPatchFromStatic } from "../seo-defaults";

export type ToolSuggestionLike = {
  id?: string | number;
  appName?: string | null;
  repoUrl?: string | null;
  homepageUrl?: string | null;
  description?: string | null;
  license?: string | null;
  categoryHint?: string | null;
  reviewNote?: string | null;
  reviewedCategory?: unknown;
  catalogTool?: unknown;
};

function relationshipId(val: unknown): string | number | null {
  if (val == null) return null;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string" && val.trim() !== "") return val;
  if (typeof val === "object" && val !== null && "id" in val) {
    const id = (val as { id: unknown }).id;
    if (id != null && id !== "") return id as string | number;
  }
  return null;
}

function trimText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRepoUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    u.search = "";
    return u.href.replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

/** Derive a Payload-safe catalog slug from the suggestion name and repo URL. */
export function suggestCatalogToolSlug(suggestion: ToolSuggestionLike): string {
  const repo = trimText(suggestion.repoUrl);
  if (repo) {
    try {
      const u = new URL(repo);
      const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
      if (segments.length >= 1) {
        const repoName = segments[segments.length - 1]?.replace(/\.git$/i, "");
        if (repoName) {
          return normalizeToCatalogToolSlug(repoName);
        }
      }
    } catch {
      /* fall through */
    }
  }
  const name = trimText(suggestion.appName);
  if (name) {
    return normalizeToCatalogToolSlug(slugify(name));
  }
  return "app";
}

async function uniquifyCatalogToolSlug(
  req: PayloadRequest,
  base: string,
): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (true) {
    const found = await req.payload.find({
      collection: "catalog-tools",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (!found.docs.length) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function buildWhyIncluded(suggestion: ToolSuggestionLike): string {
  const description = trimText(suggestion.description);
  const note = trimText(suggestion.reviewNote);
  if (description && note) {
    return `${description}\n\nEditorial note: ${note}`;
  }
  return description || note || "Accepted from a public tool suggestion — refine editorial copy in CMS.";
}

function buildBestFor(suggestion: ToolSuggestionLike): string {
  const hint = trimText(suggestion.categoryHint);
  if (hint) {
    return `Use cases in ${hint} — refine after hands-on review.`;
  }
  return "General use within the assigned catalog category — refine after hands-on review.";
}

export function buildCatalogToolCreateData(
  suggestion: ToolSuggestionLike,
  categoryId: string | number,
  slug: string,
  publish: boolean,
): Record<string, unknown> {
  const name = trimText(suggestion.appName) || "Untitled tool";
  const summary =
    trimText(suggestion.description) ||
    "Open source tool accepted from a public suggestion — add a concise summary in CMS.";
  const repoUrl = trimText(suggestion.repoUrl);
  const homepage = trimText(suggestion.homepageUrl);
  const officialSite = homepage || repoUrl;
  const license = trimText(suggestion.license) || "See repository";
  const whyIncluded = buildWhyIncluded(suggestion);

  return {
    name,
    slug,
    ...toolSeoPatchFromStatic({
      name,
      slug,
      summary,
      whyIncluded,
      license,
    }),
    status: publish ? "published" : "in_review",
    visibleOnWebsite: true,
    category: categoryId,
    rank: "also-strong",
    editorialWeight: 0,
    featured: false,
    summary,
    whyIncluded,
    bestFor: buildBestFor(suggestion),
    targetUsers:
      "Teams and individuals evaluating open source tools in this category — refine for specificity in CMS.",
    platforms: [
      { platform: "Linux" },
      { platform: "Windows" },
      { platform: "macOS" },
    ],
    license,
    openSourceStatus: "osi-approved",
    maintenanceStatus: "active",
    maturity: "growing",
    officialSite,
    sourceRepo: repoUrl,
    strengths: [
      {
        line:
          trimText(suggestion.description).split(/[.!?]\s/)[0]?.slice(0, 200) ||
          "Open source — editorial strengths pending review.",
      },
    ],
    ...(publish ? { publishedAt: new Date().toISOString() } : {}),
  };
}

export type CreateCatalogToolResult = {
  toolId: string | number;
  slug: string;
  created: boolean;
  published: boolean;
};

/**
 * Creates (or reuses) a catalog-tools row when a suggestion is accepted.
 * Idempotent: skips when `catalogTool` is already set or the repo URL exists in catalog-tools.
 */
export async function createCatalogToolFromSuggestion(
  req: PayloadRequest,
  suggestion: ToolSuggestionLike,
  options: { fromSuggestionAccept?: boolean },
): Promise<CreateCatalogToolResult> {
  const existingLink = relationshipId(suggestion.catalogTool);
  if (existingLink != null) {
    const linked = await req.payload.findByID({
      collection: "catalog-tools",
      id: existingLink,
      depth: 0,
      overrideAccess: true,
    });
    return {
      toolId: existingLink,
      slug: String(linked?.slug ?? ""),
      created: false,
      published: linked?.status === "published",
    };
  }

  const categoryId = relationshipId(suggestion.reviewedCategory);
  if (categoryId == null) {
    throw new Error(
      "Cannot create catalog tool without a reviewed category on the suggestion.",
    );
  }

  const repoUrl = trimText(suggestion.repoUrl);
  if (repoUrl) {
    const normalized = normalizeRepoUrl(repoUrl);
    const byRepo = await req.payload.find({
      collection: "catalog-tools",
      where: {
        or: [
          { sourceRepo: { equals: repoUrl } },
          { sourceRepo: { equals: normalized } },
          { sourceRepo: { equals: `${normalized}/` } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const match = byRepo.docs[0];
    if (match?.id != null) {
      const matchCat = relationshipId(match.category);
      if (String(matchCat) !== String(categoryId)) {
        await req.payload.update({
          collection: "catalog-tools",
          id: match.id as string | number,
          data: { category: categoryId },
          req,
          overrideAccess: true,
        });
      }
      return {
        toolId: match.id as string | number,
        slug: String(match.slug ?? ""),
        created: false,
        published: match.status === "published",
      };
    }
  }

  const baseSlug = suggestCatalogToolSlug(suggestion);
  const slug = await uniquifyCatalogToolSlug(req, baseSlug);
  const publish = options.fromSuggestionAccept === true;
  const data = buildCatalogToolCreateData(
    suggestion,
    categoryId,
    slug,
    publish,
  );

  const ctx = (req.context ?? {}) as Record<string, unknown>;
  if (options.fromSuggestionAccept) {
    ctx[ACCEPT_SUGGESTION_CONTEXT] = true;
    req.context = ctx;
  }

  const created = await req.payload.create({
    collection: "catalog-tools",
    data,
    req,
    overrideAccess: true,
    context: options.fromSuggestionAccept
      ? { [ACCEPT_SUGGESTION_CONTEXT]: true }
      : undefined,
  });

  return {
    toolId: created.id as string | number,
    slug: String(created.slug ?? slug),
    created: true,
    published: options.fromSuggestionAccept === true || created.status === "published",
  };
}
