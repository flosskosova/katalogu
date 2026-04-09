import type { CollectionConfig } from "payload";
import { adminOnlyAccess, editorAndAdminAccess } from "../access";

export const CatalogTags: CollectionConfig = {
  slug: "catalog-tags",
  labels: { singular: "Tag", plural: "Tags" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "tagType", "sortOrder"],
    group: "Catalog",
  },
  access: {
    read: editorAndAdminAccess,
    /** Tag vocabulary is admin-managed; editors still read tags when editing tools. */
    create: adminOnlyAccess,
    update: adminOnlyAccess,
    delete: () => false,
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
      name: "tagType",
      type: "select",
      defaultValue: "editorial",
      options: [
        { label: "Editorial", value: "editorial" },
        { label: "Platform", value: "platform" },
        { label: "Topic", value: "topic" },
      ],
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
    },
  ],
};
