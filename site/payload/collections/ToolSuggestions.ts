import type { CollectionConfig } from "payload";
import { editorAndAdminAccess } from "../access";

function relationshipHasId(val: unknown): boolean {
  if (val == null) return false;
  if (typeof val === "number" && !Number.isNaN(val)) return true;
  if (typeof val === "string" && val.trim() !== "") return true;
  if (typeof val === "object" && val !== null && "id" in val) {
    const id = (val as { id: unknown }).id;
    return id != null && id !== "";
  }
  return false;
}

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
      "Suggestions from the public “Suggest FOSS App/Tool” form. Review the repo, then add a catalog entry if appropriate. Staff (editors and admins) may delete rows. If delete hangs or never applies, redeploy the latest build (Postgres pool must allow at least two connections on Vercel) and remove PAYLOAD_POSTGRES_POOL_MAX=1 from Vercel env if present — see site README.",
    components: {
      beforeList: ["@/payload/components/ToolSuggestionsListHint#ToolSuggestionsListHint"],
      edit: {
        beforeDocumentControls: [
          "@/payload/components/ToolSuggestionDocumentControls#ToolSuggestionDocumentControls",
        ],
      },
    },
  },
  access: {
    /** Only the secured API route creates rows (overrideAccess). */
    create: () => false,
    read: editorAndAdminAccess,
    update: editorAndAdminAccess,
    /** Editors and admins may remove spam / mistaken rows (list bulk delete uses this too). */
    delete: editorAndAdminAccess,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc }) => {
        const next = data?.status as string | undefined;
        const prev = originalDoc?.status as string | undefined;
        if (next === "accepted" && prev !== "accepted") {
          if (!relationshipHasId(data?.reviewedCategory)) {
            throw new Error(
              "Select a suggested catalog category before accepting this suggestion (or use Decline).",
            );
          }
        }
        return data;
      },
    ],
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
        { label: "Declined", value: "rejected" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Use Accept / Decline on the toolbar, or bulk edit when multiple rows are selected.",
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
      name: "reviewedCategory",
      type: "relationship",
      relationTo: "catalog-categories",
      label: "Suggested catalog category",
      admin: {
        description:
          "When the submitter’s category hint is wrong or missing, pick the catalog category that fits this tool. Required before Accept.",
        position: "sidebar",
      },
    },
    {
      name: "reviewNote",
      type: "textarea",
      label: "Review note",
      admin: {
        description: "Internal note for your team (why accepted / declined).",
        position: "sidebar",
        rows: 4,
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
