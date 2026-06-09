import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function trimmed(s: string | null | undefined): string {
  return s?.trim() ?? "";
}

/**
 * One-off deploy debugging when `/admin` fails with a digest-only error in the browser.
 * Set `CMS_PREFLIGHT_SECRET` in Vercel (Production), redeploy, then GET:
 *   /api/cms-preflight?secret=<same value>
 * Remove the env var after checking. Never commit the secret.
 */
export async function GET(req: NextRequest) {
  const expected = trimmed(process.env.CMS_PREFLIGHT_SECRET);
  if (!expected) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }
  const given = trimmed(req.nextUrl.searchParams.get("secret"));
  if (given !== expected) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const databaseUrl = trimmed(process.env.DATABASE_URL);
  const tursoUrl = trimmed(process.env.TURSO_DATABASE_URL);
  const postgresLike =
    Boolean(databaseUrl) && /^postgres(ql)?:\/\//i.test(databaseUrl);
  const libsqlOnDatabaseUrl =
    Boolean(databaseUrl) && databaseUrl.startsWith("libsql:");
  const tursoSet = Boolean(tursoUrl);
  const secretLen = trimmed(process.env.PAYLOAD_SECRET).length;

  return NextResponse.json({
    DATABASE_URL_set: Boolean(databaseUrl),
    DATABASE_URL_looksLikePostgres: postgresLike,
    DATABASE_URL_looksLikeLibsql: libsqlOnDatabaseUrl,
    TURSO_DATABASE_URL_set: tursoSet,
    /** True if Payload can pick Postgres or remote libsql from env (see payload.config `dbAdapter`). */
    hasDbUrlPayloadCanUse: postgresLike || tursoSet || libsqlOnDatabaseUrl,
    PAYLOAD_SECRET_charLength: secretLen,
    PAYLOAD_SECRET_meetsLength32: secretLen >= 32,
    PAYLOAD_SERVER_URL_set: Boolean(trimmed(process.env.PAYLOAD_SERVER_URL)),
    NEXT_PUBLIC_SITE_URL_set: Boolean(trimmed(process.env.NEXT_PUBLIC_SITE_URL)),
    NEXT_PUBLIC_SERVER_URL_set: Boolean(trimmed(process.env.NEXT_PUBLIC_SERVER_URL)),
    VERCEL: process.env.VERCEL ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
    nextSteps:
      !postgresLike && !tursoSet && !libsqlOnDatabaseUrl
        ? "This deployment has no postgres:// DATABASE_URL and no TURSO_DATABASE_URL — /admin cannot connect. Set DATABASE_URL for Production + Runtime (not Build-only), redeploy, then run test:pg locally with the same URI."
        : secretLen < 32
          ? "Set PAYLOAD_SECRET to a random string of at least 32 characters for Production, redeploy."
          : "Env looks sufficient for DB + secret. If /admin still errors, open Vercel → Logs for that request: look for Postgres timeout, ECONNREFUSED, 28P01 (wrong password), or RSC errors — often wrong pooler URI, password not URL-encoded, or PAYLOAD_SERVER_URL not matching the URL in the browser.",
  });
}
