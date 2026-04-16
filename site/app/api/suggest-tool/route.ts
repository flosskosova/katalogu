import { NextResponse } from "next/server";

import { getPayloadClient } from "@/lib/payload";
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

/**
 * Walk Error.cause chains and Payload/pg fields (detail, validation errors, Drizzle).
 */
function collectErrorText(err: unknown): string {
  const parts: string[] = [];
  let e: unknown = err;
  let depth = 0;
  while (e != null && depth < 16) {
    if (typeof e === "string") {
      parts.push(e);
      break;
    }
    if (e instanceof Error) {
      parts.push(e.message);
      e = e.cause;
      depth++;
      continue;
    }
    if (e && typeof e === "object") {
      const o = e as Record<string, unknown>;
      if (typeof o.message === "string") parts.push(o.message);
      if (typeof o.detail === "string") parts.push(`detail: ${o.detail}`);
      if (typeof o.hint === "string") parts.push(`hint: ${o.hint}`);
      if (typeof o.code === "string" && /^\d{5}$/.test(o.code)) {
        parts.push(`pgcode: ${o.code}`);
      }
      if (Array.isArray(o.errors)) {
        try {
          parts.push(JSON.stringify(o.errors));
        } catch {
          parts.push("errors: [unserializable]");
        }
      }
      if (o.data != null && typeof o.data === "object") {
        try {
          parts.push(JSON.stringify(o.data));
        } catch {
          /* ignore */
        }
      }
      const next = o.cause ?? o.err ?? o.error;
      if (next === e) break;
      e = next;
      depth++;
      continue;
    }
    parts.push(String(e));
    break;
  }
  return parts.filter(Boolean).join(" | ") || String(err);
}

/** Host only — for ops logs when DNS fails (no password logged). */
function postgresHostFromDatabaseUrlEnv(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw || !/^postgres(ql)?:/i.test(raw)) return undefined;
  try {
    const u = new URL(raw.replace(/^postgres(ql)?:/i, "https:"));
    return u.hostname || undefined;
  } catch {
    return undefined;
  }
}

function pgErrorCode(err: unknown): string | undefined {
  let e: unknown = err;
  let depth = 0;
  while (e != null && depth < 12) {
    if (e && typeof e === "object" && "code" in e) {
      const c = (e as { code: unknown }).code;
      if (typeof c === "string" && /^\d{5}$|^[A-Z0-9_]+$/.test(c)) return c;
    }
    if (e instanceof Error) {
      e = e.cause;
      depth++;
      continue;
    }
    if (e && typeof e === "object") {
      const o = e as Record<string, unknown>;
      e = o.cause ?? o.err ?? o.error;
      depth++;
      continue;
    }
    break;
  }
  return undefined;
}

function logDbFailure(context: string, err: unknown) {
  const text = collectErrorText(err);
  const code = pgErrorCode(err);
  console.error(
    `[suggest-tool] ${context}${code ? ` code=${code}` : ""}: ${text}`,
  );
  if (/enotfound/i.test(text)) {
    const host = postgresHostFromDatabaseUrlEnv();
    if (host) {
      console.error(
        `[suggest-tool] DATABASE_URL host "${host}" failed DNS (ENOTFOUND). On Vercel, do not use Supabase "Direct" (db.*.supabase.co — IPv6); use Session pooler URI from Supabase Connect (pooler.supabase.com:5432). See Supabase docs: IPv4 / Supavisor. Redeploy after changing DATABASE_URL.`,
      );
    }
  }
}

function errorMessageForDbFailure(err: unknown): string {
  const blob = collectErrorText(err);
  const lower = blob.toLowerCase();

  if (/enotfound/i.test(lower)) {
    return "Database host could not be reached. On serverless hosts like Vercel, use Supabase Session pooler (IPv4), not the Direct db.* connection — copy the Session pooler URI from Supabase Connect, set DATABASE_URL in Vercel, and redeploy.";
  }
  if (/self-signed certificate in certificate chain|self_signed_cert|ssl.*cert|cert.*chain/i.test(lower)) {
    return "Database TLS verification failed. On a dev machine, set PAYLOAD_POSTGRES_TLS_INSECURE=1 in .env only if behind SSL inspection, or use PAYLOAD_POSTGRES_SSLMODE=require; on Vercel keep defaults unless your host documents otherwise.";
  }
  if (
    /no such table|relation .* does not exist|undefined_table|42p01|sqlite_error|pgcode: 42p01/i.test(
      lower,
    )
  ) {
    return "Database is not migrated yet. Run Payload migrations on the server, then try again.";
  }
  if (
    /row-level security|violates row-level security|rls policy|must provide a qualifying row/i.test(
      lower,
    )
  ) {
    return "Could not save your suggestion due to a database access policy. Please contact the site administrator.";
  }
  if (/permission denied|pgcode: 42501/i.test(lower)) {
    return "Could not save your suggestion due to a database permission error. Please contact the site administrator.";
  }
  if (
    /pgbouncer|prepared statement|bind message|no more connections|server closed the connection|connection terminated|econnreset|connection reset|pool/i.test(
      lower,
    )
  ) {
    return "Could not connect to the database reliably. Please try again in a minute. If this keeps happening, the site administrator should check the Postgres connection (Supabase pooler vs direct port 5432).";
  }
  if (/connection|econnrefused|timeout|etimedout|ssl|certificate|getaddrinfo/i.test(lower)) {
    return "Could not reach the database. Please try again in a few minutes.";
  }
  if (/failed query|insert into|update |violates|constraint|duplicate key|unique constraint|pgcode: 23/i.test(lower)) {
    return "Could not save your suggestion due to a database error. Please try again or contact the site administrator.";
  }
  return "Could not save your suggestion. Please try again later.";
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

  const payloadSecret = process.env.PAYLOAD_SECRET?.trim() || "";
  const insecurePayloadSecret =
    !payloadSecret || payloadSecret === "CHANGE_ME_DEV_ONLY";
  if (process.env.NODE_ENV === "production" && insecurePayloadSecret) {
    console.error(
      "[suggest-tool] PAYLOAD_SECRET is missing/weak in production; refusing submissions.",
    );
    return jsonError("Service temporarily unavailable. Please try again later.", 503);
  }
  if (insecurePayloadSecret) {
    console.warn(
      "[suggest-tool] Set a strong PAYLOAD_SECRET in production for rate-limit hashing.",
    );
  }

  let turnstileSecret: string;
  try {
    turnstileSecret = resolveTurnstileSecret();
  } catch (err) {
    console.error("[suggest-tool] Turnstile secret misconfiguration", err);
    return jsonError("Verification service is unavailable. Please try again later.", 503);
  }
  const token = body.turnstileToken?.trim();
  if (!token) {
    return jsonError("Verification required. Please complete the CAPTCHA.", 400);
  }
  const clientIp = getClientIpFromHeaders(req.headers);
  const captchaOk = await verifyTurnstileToken(token, turnstileSecret, {
    remoteIp: clientIp,
  });
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

  let payload;
  try {
    payload = await getPayloadClient();
  } catch (err) {
    logDbFailure("getPayload failed", err);
    return jsonError(errorMessageForDbFailure(err), 503);
  }

  const ipHash = hashIpForRateLimit(clientIp, payloadSecret || "dev");

  let rate;
  try {
    rate = await assertSuggestionRateLimit(payload, ipHash, submitterEmail);
  } catch (err) {
    logDbFailure("rate limit query failed", err);
    payload.logger.error({ err, msg: "[suggest-tool] rate limit query failed" });
    return jsonError(errorMessageForDbFailure(err), 500);
  }
  if (!rate.ok) {
    return jsonError(rate.reason, 429);
  }

  let doc: { id: string | number };
  try {
    doc = await payload.create({
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
  } catch (err) {
    logDbFailure("payload.create failed", err);
    payload.logger.error({ err, msg: "[suggest-tool] payload.create failed" });
    return jsonError(errorMessageForDbFailure(err), 500);
  }

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
