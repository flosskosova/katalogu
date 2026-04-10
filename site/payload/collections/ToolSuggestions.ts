import type { CollectionConfig } from "payload";
import {
  adminOnlyAccess,
  editorAndAdminAccess,
} from "../access";

/**
 * Visitor-submitted FOSS app/tool ideas (created only via POST /api/suggest-tool with spam checks).
 */
export const ToolSuggestions: CollectionConfig = {
  slug: "tool-suggestions",
  labels: {
    singular: "Tool suggestion",
    plural: "Tool suggestions",
  },
  admin: {
    group: "Suggestions",
    useAsTitle: "appName",
    defaultColumns: [
      "appName",
      "submitterEmail",
      "status",
      "repoUrl",
      "createdAt",
    ],
    description:
      "Suggestions from the public “Suggest FOSS App/Tool” form. Review the repo, then add a catalog entry if appropriate.",
  },
  access: {
    /** Only the secured API route creates rows (overrideAccess). */
    create: () => false,
    read: editorAndAdminAccess,
    update: editorAndAdminAccess,
    delete: adminOnlyAccess,
  },
  fields: [
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { label: "New", value: "new" },
        { label: "Reviewed", value: "reviewed" },
        { label: "Accepted", value: "accepted" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "appName",
      type: "text",
      required: true,
      label: "App / tool name",
    },
    {
      name: "repoUrl",
      type: "text",
      required: true,
      label: "Repository URL",
      admin: {
        description: "GitHub or GitLab project URL (https).",
      },
    },
    {
      name: "homepageUrl",
      type: "text",
      label: "Homepage / website",
      admin: {
        description: "Optional official site or docs landing page.",
      },
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      label: "Description",
      admin: {
        description: "What it does and why it belongs in the catalog.",
      },
    },
    {
      name: "license",
      type: "text",
      label: "License (if known)",
      admin: {
        description: "e.g. MIT, GPL-3.0, Apache-2.0",
      },
    },
    {
      name: "categoryHint",
      type: "text",
      label: "Category or domain",
      admin: {
        description: "e.g. DevOps, Graphics, Security — editorial hint only.",
      },
    },
    {
      name: "additionalNotes",
      type: "textarea",
      label: "Additional notes",
      admin: {
        description: "Optional context, related projects, packaging, etc.",
      },
    },
    {
      name: "submitterName",
      type: "text",
      label: "Your name",
    },
    {
      name: "submitterEmail",
      type: "email",
      required: true,
      label: "Your email",
      admin: {
        description: "For follow-up questions only.",
      },
    },
    {
      name: "submissionIpHash",
      type: "text",
      label: "IP hash",
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "SHA-256 hash for rate limiting (not reversible).",
      },
    },
    {
      name: "userAgent",
      type: "text",
      label: "User agent",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
  ],
};
