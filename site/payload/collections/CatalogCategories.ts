import type { CollectionConfig } from "payload";
import { editorAndAdminAccess, isStaffAdmin } from "../access";
import { applyCategorySeoDefaults } from "../seo-defaults";

export const CatalogCategories: CollectionConfig = {
  slug: "catalog-categories",
  labels: { singular: "Category", plural: "Categories" },
  admin: {
    useAsTitle: "name",
    defaultColumns: [
      "name",
      "slug",
      "visibleOnWebsite",
      "featured",
      "sortOrder",
      "updatedAt",
    ],
    group: "Catalog",
    description: "Top-level and nested categories for organizing tools.",
    livePreview: {
      url: ({ data }) => {
        const base =
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const slug = data?.slug as string | undefined;
        const secret = process.env.PREVIEW_SECRET;
        if (!slug || !secret) return `${base}/categories/${slug ?? ""}`;
        return `${base}/api/draft?secret=${encodeURIComponent(secret)}&type=category&slug=${encodeURIComponent(slug)}`;
      },
    },
  },
  access: {
    read: editorAndAdminAccess,
    create: editorAndAdminAccess,
    update: editorAndAdminAccess,
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const next = data?.status as string | undefined;
        const prev = originalDoc?.status as string | undefined;
        if (next === "published" && prev !== "published") {
          if (!(await isStaffAdmin(req))) {
            throw new Error(
              "Only administrators can publish categories. Editors can draft or mark In review.",
            );
          }
          const errs: string[] = [];
          if (!data?.name) errs.push("Name");
          if (!data?.slug) errs.push("Slug");
          if (!String(data?.summary ?? "").trim()) errs.push("Summary");
          if (!String(data?.description ?? "").trim()) errs.push("Description");
          if (errs.length) {
            throw new Error(`Publishing blocked — fix: ${errs.join("; ")}`);
          }
        }
        if (
          prev === "published" &&
          next &&
          next !== "published"
        ) {
          if (!(await isStaffAdmin(req))) {
            throw new Error(
              "Only administrators can unpublish or archive categories.",
            );
          }
        }
        applyCategorySeoDefaults(
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
          label: "Content",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
            },
            {
              name: "slug",
              type: "text",
              required: true,
              unique: true,
              index: true,
              admin: {
                description: "URL segment, e.g. web-browsers. Lowercase, hyphens.",
              },
            },
            {
              name: "summary",
              type: "textarea",
              required: true,
              admin: {
                description: "One-line card summary for the public site.",
              },
            },
            {
              name: "description",
              type: "textarea",
              required: true,
              admin: {
                description: "Longer editorial intro on the category page.",
              },
            },
            {
              name: "parent",
              type: "relationship",
              relationTo: "catalog-categories",
              admin: {
                description: "Optional parent for subcategories.",
              },
            },
            {
              name: "icon",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Optional icon (square image recommended).",
              },
            },
          ],
        },
        {
          label: "Display & SEO",
          admin: {
            description:
              "SEO fields auto-fill from name, summary, slug, and icon on save when empty.",
          },
          fields: [
            {
              name: "featured",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "sortOrder",
              type: "number",
              defaultValue: 0,
              admin: { description: "Lower numbers appear first in listings." },
            },
            {
              name: "seoTitle",
              type: "text",
              admin: {
                description:
                  "HTML & social title (~50–60 chars). Auto: “{Name} — open source tools · site name”.",
              },
            },
            {
              name: "seoDescription",
              type: "textarea",
              admin: {
                description:
                  "Meta & OG description (~150–160 chars). Auto from card summary when empty.",
              },
            },
            {
              name: "canonicalSlug",
              type: "text",
              admin: {
                description:
                  "Canonical /categories/{slug}. Auto matches slug when empty.",
              },
            },
            {
              name: "ogImage",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "Social share image. Auto uses category icon when empty.",
              },
            },
          ],
        },
        {
          label: "Workflow",
          fields: [
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
                  "Off = category and its tools are hidden from public listings (draft preview still shows them).",
                components: {
                  Cell: "@/payload/components/VisibleOnWebsiteCell#VisibleOnWebsiteCell",
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
