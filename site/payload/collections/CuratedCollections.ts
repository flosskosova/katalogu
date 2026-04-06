import type { CollectionConfig } from "payload";
import { editorAndAdminAccess, isAdmin } from "../access";

export const CuratedCollections: CollectionConfig = {
  slug: "curated-collections",
  labels: { singular: "Collection", plural: "Collections" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "featured", "status", "updatedAt"],
    group: "Catalog",
    description:
      "Editor’s picks, beginner lists, privacy-focused sets — ordered tool lists for the homepage and landing pages.",
    livePreview: {
      url: ({ data }) => {
        const base =
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const slug = data?.slug as string | undefined;
        const secret = process.env.PREVIEW_SECRET;
        if (!slug || !secret) return `${base}/collections/${slug ?? ""}`;
        return `${base}/api/draft?secret=${encodeURIComponent(secret)}&type=collection&slug=${encodeURIComponent(slug)}`;
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
        const user = req.user as { role?: string } | undefined;
        const next = data?.status as string | undefined;
        const prev = originalDoc?.status as string | undefined;
        if (next === "published" && prev !== "published") {
          if (!isAdmin(user)) {
            throw new Error(
              "Only administrators can publish collections. Editors can draft or mark In review.",
            );
          }
          const errs: string[] = [];
          if (!data?.name) errs.push("Name");
          if (!data?.slug) errs.push("Slug");
          const items = data?.items as unknown[] | undefined;
          if (!Array.isArray(items) || items.length === 0) {
            errs.push("At least one tool in the list");
          }
          if (errs.length) {
            throw new Error(`Publishing blocked — fix: ${errs.join("; ")}`);
          }
        }
        if (
          prev === "published" &&
          next &&
          next !== "published"
        ) {
          if (!isAdmin(user)) {
            throw new Error(
              "Only administrators can unpublish or archive collections.",
            );
          }
        }
        return data;
      },
    ],
  },
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
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "displayStyle",
      type: "select",
      defaultValue: "grid",
      options: [
        { label: "Grid", value: "grid" },
        { label: "List", value: "list" },
        { label: "Compact", value: "compact" },
      ],
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "items",
      type: "array",
      minRows: 0,
      labels: { singular: "Item", plural: "Items" },
      fields: [
        {
          name: "tool",
          type: "relationship",
          relationTo: "catalog-tools",
          required: true,
        },
        {
          name: "sortOrder",
          type: "number",
          defaultValue: 0,
        },
        {
          name: "blurb",
          type: "textarea",
          admin: {
            description: "Optional short override text for this list only.",
          },
        },
      ],
    },
    {
      name: "seoTitle",
      type: "text",
    },
    {
      name: "seoDescription",
      type: "textarea",
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
  ],
};
