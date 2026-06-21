import type { Payload, PayloadRequest } from "payload";
import { isRequestUserEditorOrAdmin } from "../usersAccessHooks";
import {
  createCatalogToolFromSuggestion,
  type ToolSuggestionLike,
} from "./createCatalogToolFromSuggestion";
import { ACCEPT_SUGGESTION_CONTEXT } from "./constants";

export { ACCEPT_SUGGESTION_CONTEXT } from "./constants";

export type AcceptToolSuggestionResult = {
  suggestionId: string | number;
  toolId: string | number;
  toolSlug: string;
  created: boolean;
  published: boolean;
  categoryId: string | number;
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

/**
 * Accept a tool suggestion: create (or link) a catalog-tools row in the reviewed category,
 * then mark the suggestion accepted. Used by collection hooks and the accept API route.
 */
export async function acceptToolSuggestion(
  payload: Payload,
  req: PayloadRequest,
  args: {
    suggestionId: string | number;
    reviewedCategory: string | number;
    reviewNote?: string;
  },
): Promise<AcceptToolSuggestionResult> {
  if (!(await isRequestUserEditorOrAdmin(req))) {
    throw new Error("Sign in as an editor or admin to accept suggestions.");
  }

  const categoryId = args.reviewedCategory;
  if (categoryId == null || categoryId === "") {
    throw new Error("Choose a catalog category before accepting.");
  }

  const suggestion = await payload.findByID({
    collection: "tool-suggestions",
    id: args.suggestionId,
    depth: 0,
    overrideAccess: true,
    req,
  });

  if (!suggestion) {
    throw new Error("Suggestion not found.");
  }

  const merged: ToolSuggestionLike = {
    ...(suggestion as ToolSuggestionLike),
    reviewedCategory: categoryId,
    reviewNote: args.reviewNote ?? (suggestion as ToolSuggestionLike).reviewNote,
  };

  const ctx = (req.context ?? {}) as Record<string, unknown>;
  ctx[ACCEPT_SUGGESTION_CONTEXT] = true;
  req.context = ctx;

  const toolResult = await createCatalogToolFromSuggestion(req, merged, {
    fromSuggestionAccept: true,
  });

  const updated = await payload.update({
    collection: "tool-suggestions",
    id: args.suggestionId,
    data: {
      status: "accepted",
      reviewedCategory: categoryId,
      reviewNote: args.reviewNote,
      catalogTool: toolResult.toolId,
    },
    req,
    overrideAccess: true,
    context: { [ACCEPT_SUGGESTION_CONTEXT]: true },
  });

  return {
    suggestionId: updated.id as string | number,
    toolId: toolResult.toolId,
    toolSlug: toolResult.slug,
    created: toolResult.created,
    published: toolResult.published,
    categoryId,
  };
}
