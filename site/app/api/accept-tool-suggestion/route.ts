import { NextResponse } from "next/server";
import { createPayloadRequest } from "payload";

import config from "@payload-config";
import { acceptToolSuggestion } from "@/payload/tool-suggestions/acceptToolSuggestion";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  suggestionId?: string | number;
  reviewedCategory?: string | number;
  reviewNote?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * Accept a tool suggestion: creates a published catalog-tools entry in the chosen category.
 * Uses a single Payload instance from createPayloadRequest (no extra DB clients).
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const suggestionId = body.suggestionId;
  const reviewedCategory = body.reviewedCategory;
  if (suggestionId == null || suggestionId === "") {
    return jsonError("suggestionId is required.", 400);
  }
  if (reviewedCategory == null || reviewedCategory === "") {
    return jsonError("reviewedCategory is required.", 400);
  }

  try {
    const payloadReq = await createPayloadRequest({
      request: req,
      config,
      payloadInstanceCacheKey: "default",
    });

    const result = await acceptToolSuggestion(payloadReq.payload, payloadReq, {
      suggestionId,
      reviewedCategory,
      reviewNote:
        typeof body.reviewNote === "string" ? body.reviewNote.trim() || undefined : undefined,
    });

    return NextResponse.json({
      ok: true,
      message: result.created
        ? `Created catalog tool “${result.toolSlug}” in the selected category.`
        : `Linked existing catalog tool “${result.toolSlug}” and updated its category.`,
      ...result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not accept suggestion.";
    const status = /sign in|editor|admin|forbidden/i.test(message) ? 403 : 400;
    console.error("[accept-tool-suggestion]", message, e);
    return jsonError(message, status);
  }
}
