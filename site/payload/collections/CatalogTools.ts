import type { CollectionConfig } from "payload";
import { CATALOG_TOOL_SLUG_RE } from "../../lib/catalog-tool-slug";
import {
  adminOnlyAccess,
  editorAndAdminAccess,
  isStaffAdmin,
} from "../access";
import { ACCEPT_SUGGESTION_CONTEXT } from "../tool-suggestions/constants";
import { applyToolSeoDefaults } from "../seo-defaults";

function assertValidUrl(label: string, value: unknown) {
  if (typeof value !== "string" || !value.trim()) return `${label} is required`;
  try {
    const u = new URL(value.trim());
    if (!["http:", "https:"].includes(u.protocol)) return `${label} must be http(s)`;
  } catch {
    return `${label} is not a valid URL`;
  }
  return null;
}

function optionalHttpUrl(label: string, value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !value.trim()) return null;
  return assertValidUrl(label, value);
}

export const CatalogTools: CollectionConfig = {
  slug: "catalog-tools",
  labels: { singular: "Tool", plural: "Tools" },
  admin: {
    description:
      "Database only — the public site may merge in static `data/tools` entries until they are imported here. Run `npm run catalog:sync` (or `seed:catalog`) from the `site` folder, then `verify:catalog-sync` in CI.",
    useAsTitle: "name",
    listSearchableFields: ["name", "slug"],
    components: {
      beforeList: ["@/payload/components/ToolsListSyncHint#ToolsListSyncHint"],
    },
    defaultColumns: [
      "name",
      "slug",
      "status",
      "visibleOnWebsite",
      "rank",
      "featured",
      "updatedAt",
    ],
    group: "Catalog",
    livePreview: {
      url: ({ data }) => {
        const base =
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const slug = data?.slug as string | undefined;
        const secret = process.env.PREVIEW_SECRET;
        if (!slug || !secret) return `${base}/tools/${slug ?? ""}`;
        return `${base}/api/draft?secret=${encodeURIComponent(secret)}&type=tool&slug=${encodeURIComponent(slug)}`;
      },
    },
  },
  access: {
    read: editorAndAdminAccess,
    create: editorAndAdminAccess,
    update: editorAndAdminAccess,
    /** Admins only — editors should use status Archived when possible */
    delete: adminOnlyAccess,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        const user = req.user as { id?: string | number; role?: string } | undefined;
        const uid = user?.id;
        if (uid != null) {
          data.updatedBy = uid;
          if (operation === "create") {
            data.createdBy = uid;
          }
        }

        const nameNorm = String(data.name ?? "").trim().toLowerCase();
        const warnings: string[] = [];
        if (nameNorm) {
          const others = await req.payload.find({
            collection: "catalog-tools",
            limit: 1000,
            depth: 0,
            overrideAccess: true,
          });
          const dupSlugs = others.docs
            .filter((d) => {
              if (originalDoc?.id != null && d.id === originalDoc.id) return false;
              return String(d.name ?? "").trim().toLowerCase() === nameNorm;
            })
            .map((d) => String(d.slug ?? ""));
          if (dupSlugs.length) {
            warnings.push(
              `⚠ Another entry shares this display name (slugs: ${dupSlugs.join(", ")}). Consider distinguishing names if readers could confuse them.`,
            );
          }
        }
        if (!String(data.longDescription ?? "").trim()) {
          warnings.push(
            "ℹ Long description is empty — optional but adds depth for serious entries.",
          );
        }
        const hasStrength = Array.isArray(data.strengths)
          ? data.strengths.some((s: { line?: string }) =>
              String(s?.line ?? "").trim(),
            )
          : false;
        if (!hasStrength) {
          warnings.push(
            "ℹ Strengths look empty — add at least one neutral, evidence-based point before publishing.",
          );
        }
        const hasLimitation = Array.isArray(data.limitations)
          ? data.limitations.some((s: { line?: string }) =>
              String(s?.line ?? "").trim(),
            )
          : false;
        if (!hasLimitation) {
          warnings.push(
            "ℹ Limitations are empty — brief, practical tradeoffs improve editorial trust.",
          );
        }
        data.qualityWarnings = warnings.length ? warnings.join("\n\n") : "";

        const nextStatus = data.status as string | undefined;
        const prevStatus = originalDoc?.status as string | undefined;
        const fromSuggestionAccept =
          (req.context as Record<string, unknown> | undefined)?.[
            ACCEPT_SUGGESTION_CONTEXT
          ] === true;

        if (nextStatus === "published" && prevStatus !== "published") {
          if (!(await isStaffAdmin(req)) && !fromSuggestionAccept) {
            throw new Error(
              "Only administrators can publish. Editors can save drafts or mark In review.",
            );
          }
          const errs: string[] = [];
          if (!data.name) errs.push("Name");
          if (!data.slug) errs.push("Slug");
          if (!data.category) errs.push("Category");
          if (!String(data.summary ?? "").trim()) errs.push("Summary");
          if (!String(data.whyIncluded ?? "").trim())
            errs.push('"Why included" (explain evidence-based merit)');
          if (!String(data.bestFor ?? "").trim()) errs.push('"Best for"');
          if (!String(data.targetUsers ?? "").trim()) errs.push("Target users");
          const w = assertValidUrl("Website URL", data.officialSite);
          if (w) errs.push(w);
          const r = assertValidUrl("Repository URL", data.sourceRepo);
          if (r) errs.push(r);
          const docErr = optionalHttpUrl("Documentation URL", data.docsUrl);
          if (docErr) errs.push(docErr);
          if (
            !Array.isArray(data.platforms) ||
            data.platforms.length === 0 ||
            !data.platforms.some(
              (p: { platform?: string }) =>
                typeof p?.platform === "string" && p.platform.trim(),
            )
          ) {
            errs.push("At least one platform");
          }
          if (errs.length) {
            throw new Error(`Publishing blocked — fix: ${errs.join("; ")}`);
          }
          data.publishedAt = new Date().toISOString();
        }

        if (
          prevStatus === "published" &&
          nextStatus &&
          nextStatus !== "published"
        ) {
          if (!(await isStaffAdmin(req))) {
            throw new Error("Only administrators can unpublish or archive.");
          }
        }

        if (operation === "create" || data.slug !== originalDoc?.slug) {
          if (data.slug && !CATALOG_TOOL_SLUG_RE.test(String(data.slug))) {
            throw new Error(
              "Slug must be lowercase letters, numbers, and hyphens only.",
            );
          }
        }

        applyToolSeoDefaults(
          data as Record<string, unknown>,
          originalDoc as Record<string, unknown> | null | undefined,
        );

        return data;
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Identity",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
              admin: {
                description: "Official product name as readers should see it.",
              },
            },
            {
              name: "slug",
              type: "text",
              required: true,
              unique: true,
              index: true,
              admin: {
                description:
                  "URL path /tools/{slug}. Changing slugs breaks links—coordinate redirects.",
              },
            },
            {
              name: "status",
              type: "select",
              required: true,
              defaultValue: "draft",
              options: [
                { label: "Draft", value: "draft" },
                { label: "In review", value: "in_review" },
                { label: "Published", value: "published" },
                { label: "Archived", value: "archived" },
              ],
            },
            {
              name: "visibleOnWebsite",
              type: "checkbox",
              defaultValue: true,
              label: "👁 Site",
              admin: {
                description:
                  "When off, this tool stays out of browse, search, and listings on the public site (useful while published for internal reference). Draft preview still shows it.",
                components: {
                  Cell: "@/payload/components/VisibleOnWebsiteCell#VisibleOnWebsiteCell",
                },
              },
            },
            {
              name: "category",
              type: "relationship",
              relationTo: "catalog-categories",
              required: true,
              admin: {
                description: "Primary category shown on the public site.",
              },
            },
            {
              name: "subcategory",
              type: "text",
              admin: { description: "Optional finer grouping (display only)." },
            },
            {
              name: "rank",
              type: "select",
              required: true,
              defaultValue: "also-strong",
              options: [
                { label: "Top pick", value: "top-pick" },
                { label: "Also strong", value: "also-strong" },
                { label: "Honorable mention", value: "honorable" },
              ],
            },
            {
              name: "editorialWeight",
              type: "number",
              defaultValue: 0,
              admin: {
                description:
                  "Higher sorts earlier within the same rank (homepage, lists).",
              },
            },
            {
              name: "featured",
              type: "checkbox",
              defaultValue: false,
              label: "Homepage top picks",
              admin: {
                description:
                  "Show this tool in the homepage “Top picks” section. It appears together with tools whose rank is “Top pick”. Order is controlled by Editorial weight (higher first).",
              },
            },
          ],
        },
        {
          label: "Editorial",
          fields: [
            {
              name: "summary",
              type: "textarea",
              required: true,
              admin: {
                description:
                  "Neutral, concise summary. No hype — what it is and who uses it.",
              },
            },
            {
              name: "longDescription",
              type: "textarea",
              admin: {
                description:
                  "Optional deeper narrative. Prefer neutral, evidence-based wording over marketing copy.",
              },
            },
            {
              name: "whyIncluded",
              type: "textarea",
              admin: {
                description:
                  "Why this tool earns a place: maintenance, adoption, documentation, trust.",
              },
            },
            {
              name: "bestFor",
              type: "textarea",
              admin: {
                description:
                  "Practical scenarios — concrete, not marketing.",
              },
            },
            {
              name: "targetUsers",
              type: "textarea",
              admin: {
                description: "Who benefits: roles, skill levels, org types.",
              },
            },
            {
              name: "strengths",
              type: "array",
              minRows: 1,
              labels: { singular: "Strength", plural: "Strengths" },
              fields: [
                {
                  name: "line",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "limitations",
              type: "array",
              labels: { singular: "Limitation", plural: "Limitations" },
              fields: [{ name: "line", type: "text", required: true }],
            },
            {
              name: "alternatives",
              type: "array",
              labels: { singular: "Alternative", plural: "Alternatives" },
              fields: [
                {
                  name: "line",
                  type: "text",
                  required: true,
                  admin: {
                    description:
                      "Name or short phrase; may match another catalog entry.",
                  },
                },
              ],
            },
            {
              name: "replacesProprietary",
              type: "textarea",
              admin: {
                description:
                  "Optional: which common Windows, macOS, or paid cross-platform tools readers often replace with this FOSS option (one short paragraph).",
              },
            },
          ],
        },
        {
          label: "Technical",
          fields: [
            {
              name: "platforms",
              type: "array",
              minRows: 1,
              labels: { singular: "Platform", plural: "Platforms" },
              fields: [
                {
                  name: "platform",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "license",
              type: "text",
              required: true,
            },
            {
              name: "openSourceStatus",
              type: "select",
              defaultValue: "osi-approved",
              options: [
                {
                  label: "OSI-approved / recognized FOSS",
                  value: "osi-approved",
                },
                { label: "Mixed / verify per component", value: "mixed" },
                { label: "Needs legal review", value: "verify" },
              ],
            },
            {
              name: "maintenanceStatus",
              type: "select",
              required: true,
              defaultValue: "active",
              options: [
                { label: "Active", value: "active" },
                { label: "Slower cadence", value: "slow" },
                { label: "Maintenance mode", value: "maintenance" },
              ],
            },
            {
              name: "maturity",
              type: "select",
              required: true,
              defaultValue: "established",
              options: [
                { label: "Experimental", value: "experimental" },
                { label: "Growing", value: "growing" },
                { label: "Established", value: "established" },
                {
                  label: "Industry standard",
                  value: "industry-standard",
                },
              ],
            },
            {
              name: "officialSite",
              type: "text",
              required: true,
            },
            {
              name: "sourceRepo",
              type: "text",
              required: true,
            },
            {
              name: "docsUrl",
              type: "text",
              admin: { description: "Optional documentation homepage." },
            },
          ],
        },
        {
          label: "Facets & media",
          fields: [
            {
              name: "tagList",
              type: "relationship",
              relationTo: "catalog-tags",
              hasMany: true,
              admin: {
                description:
                  "Managed tags; drives filters on the public site (uses tag names).",
              },
            },
            {
              name: "privacyFocused",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "selfHosted",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "beginnerFriendly",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "developerFocused",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "endUserFocused",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "logo",
              type: "upload",
              relationTo: "media",
            },
            {
              name: "gallery",
              type: "upload",
              relationTo: "media",
              hasMany: true,
            },
            {
              name: "relatedTools",
              type: "relationship",
              relationTo: "catalog-tools",
              hasMany: true,
              admin: {
                description:
                  "Curated related entries (shown as cards on the tool page).",
              },
            },
          ],
        },
        {
          label: "SEO",
          admin: {
            description:
              "Defaults are filled automatically from name, summary, slug, and logo when you save (only if empty). Override anytime.",
          },
          fields: [
            {
              name: "seoTitle",
              type: "text",
              admin: {
                description:
                  "HTML <title> / Open Graph title (~50–60 chars). Auto: “{Name} — open source · site name”.",
              },
            },
            {
              name: "seoDescription",
              type: "textarea",
              admin: {
                description:
                  "Meta & OG description (~150–160 chars). Auto from summary when empty.",
              },
            },
            {
              name: "canonicalSlug",
              type: "text",
              admin: {
                description:
                  "Public canonical path segment /tools/{slug}. Auto matches slug when empty; set only for rare URL overrides.",
              },
            },
            {
              name: "ogImage",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "Social preview image (1200×630 recommended). Auto uses logo upload when empty.",
              },
            },
          ],
        },
        {
          label: "Scheduling",
          fields: [
            {
              name: "scheduledPublishAt",
              type: "date",
              admin: {
                description:
                  "Optional future publish time (requires a scheduler/cron calling Payload — not wired by default).",
                date: { pickerAppearance: "dayAndTime" },
              },
            },
          ],
        },
        {
          label: "Audit",
          fields: [
            {
              name: "qualityWarnings",
              type: "textarea",
              admin: {
                readOnly: true,
                rows: 8,
                description:
                  "Automated editorial hints (duplicate names, thin sections). Saving is not blocked.",
              },
            },
            {
              name: "publishedAt",
              type: "date",
              admin: {
                readOnly: true,
                description: "Set when the entry is first published.",
                date: { pickerAppearance: "dayAndTime" },
              },
            },
            {
              name: "createdBy",
              type: "relationship",
              relationTo: "users",
              admin: { readOnly: true },
            },
            {
              name: "updatedBy",
              type: "relationship",
              relationTo: "users",
              admin: { readOnly: true },
            },
          ],
        },
      ],
    },
  ],
};
