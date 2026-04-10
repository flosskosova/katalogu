import { NextResponse } from "next/server";
import { getPayload } from "payload";

import config from "@payload-config";
import {
  sendToolSuggestionNotification,
  type ToolSuggestionDoc,
} from "@/payload/email/sendToolSuggestionEmail";
import {
  getClientIpFromHeaders,
  hashIpForRateLimit,
} from "@/lib/suggest-tool/client-ip";
import { assertSuggestionRateLimit } from "@/lib/suggest-tool/rate-limit";
import { resolveTurnstileSecret } from "@/lib/suggest-tool/turnstile-server";
import { verifyTurnstileToken } from "@/lib/suggest-tool/turnstile";
import {
  clampLen,
  isAllowedRepositoryUrl,
  isOptionalHttpsUrl,
  isValidEmail,
} from "@/lib/suggest-tool/validate";

export const runtime = "nodejs";

type Body = {
  appName?: string;
  repoUrl?: string;
  homepageUrl?: string;
  description?: string;
  license?: string;
  categoryHint?: string;
  additionalNotes?: string;
  submitterName?: string;
  submitterEmail?: string;
  /** Honeypot — must be empty */
  company?: string;
  turnstileToken?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  /** Honeypot — silently accept to avoid teaching bots */
  if (body.company && String(body.company).trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const secret = process.env.PAYLOAD_SECRET || "";
  if (!secret || secret === "CHANGE_ME_DEV_ONLY") {
    console.warn(
      "[suggest-tool] Set a strong PAYLOAD_SECRET in production for rate-limit hashing.",
    );
  }

  const turnstileSecret = resolveTurnstileSecret();
  const token = body.turnstileToken?.trim();
  if (!token) {
    return jsonError("Verification required. Please complete the CAPTCHA.", 400);
  }
  const captchaOk = await verifyTurnstileToken(token, turnstileSecret);
  if (!captchaOk) {
    return jsonError("CAPTCHA verification failed. Please try again.", 400);
  }

  const appName = typeof body.appName === "string" ? body.appName : "";
  const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl : "";
  const homepageUrl = typeof body.homepageUrl === "string" ? body.homepageUrl : "";
  const description = typeof body.description === "string" ? body.description : "";
  const license = typeof body.license === "string" ? body.license : "";
  const categoryHint = typeof body.categoryHint === "string" ? body.categoryHint : "";
  const additionalNotes =
    typeof body.additionalNotes === "string" ? body.additionalNotes : "";
  const submitterName = typeof body.submitterName === "string" ? body.submitterName : "";
  const submitterEmail = typeof body.submitterEmail === "string" ? body.submitterEmail : "";

  if (!clampLen(appName, 2, 200)) {
    return jsonError("App name must be between 2 and 200 characters.", 400);
  }
  if (!isAllowedRepositoryUrl(repoUrl)) {
    return jsonError(
      "Repository URL must be a valid GitHub or GitLab project URL (https).",
      400,
    );
  }
  if (!isOptionalHttpsUrl(homepageUrl)) {
    return jsonError("Homepage must be a valid http(s) URL.", 400);
  }
  if (!clampLen(description, 20, 8000)) {
    return jsonError("Description must be between 20 and 8000 characters.", 400);
  }
  if (license && !clampLen(license, 1, 80)) {
    return jsonError("License field is too long.", 400);
  }
  if (categoryHint && !clampLen(categoryHint, 1, 120)) {
    return jsonError("Category hint is too long.", 400);
  }
  if (additionalNotes && !clampLen(additionalNotes, 0, 8000)) {
    return jsonError("Additional notes are too long.", 400);
  }
  if (submitterName && !clampLen(submitterName, 0, 120)) {
    return jsonError("Name is too long.", 400);
  }
  if (!isValidEmail(submitterEmail)) {
    return jsonError("A valid email address is required.", 400);
  }

  const payload = await getPayload({ config });
  const ip = getClientIpFromHeaders(req.headers);
  const ipHash = hashIpForRateLimit(ip, secret || "dev");

  const rate = await assertSuggestionRateLimit(
    payload,
    ipHash,
    submitterEmail,
  );
  if (!rate.ok) {
    return jsonError(rate.reason, 429);
  }

  const doc = await payload.create({
    collection: "tool-suggestions",
    data: {
      appName: appName.trim(),
      repoUrl: repoUrl.trim(),
      homepageUrl: homepageUrl.trim() || undefined,
      description: description.trim(),
      license: license.trim() || undefined,
      categoryHint: categoryHint.trim() || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
      submitterName: submitterName.trim() || undefined,
      submitterEmail: submitterEmail.trim().toLowerCase(),
      submissionIpHash: ipHash,
      userAgent: req.headers.get("user-agent")?.slice(0, 512) || undefined,
      status: "new",
    },
    overrideAccess: true,
  });

  const base =
    payload.config.serverURL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    "";
  const adminUrl = base
    ? `${base}/admin/collections/tool-suggestions/${doc.id}`
    : `/admin/collections/tool-suggestions/${doc.id}`;

  try {
    await sendToolSuggestionNotification(
      payload,
      doc as ToolSuggestionDoc,
      adminUrl,
    );
  } catch (e) {
    payload.logger.error({ err: e, msg: "[suggest-tool] notify email failed" });
  }

  return NextResponse.json({ ok: true, id: doc.id });
}
