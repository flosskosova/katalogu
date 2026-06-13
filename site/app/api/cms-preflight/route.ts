import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function trimmed(s: string | null | undefined): string {
  return s?.trim() ?? "";
}

/** Keep in sync with `payload.config.ts` `normalizedHttpsOrigin` / `resolvePayloadServerURL` (production). */
function normHttpsOrigin(raw: string | undefined): string | null {
  const s = trimmed(raw);
  if (!s) return null;
  let u = s.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u.replace(/^\/+/, "")}`;
  }
  try {
    return new URL(u).origin;
  } catch {
    return null;
  }
}

/**
 * Effective Payload `serverURL` origin on Vercel production (cookies / CSRF).
 * Does not import `payload.config` (that can throw during module load if DB env is wrong).
 */
function diagPayloadServerOrigin(): {
  effectiveOrigin: string;
  resolvedFrom:
    | "PAYLOAD_SERVER_URL"
    | "NEXT_PUBLIC_SITE_URL"
    | "NEXT_PUBLIC_SERVER_URL"
    | "VERCEL_PROJECT_PRODUCTION_URL"
    | "VERCEL_URL"
    | "fallback_localhost";
} {
  const a = normHttpsOrigin(process.env.PAYLOAD_SERVER_URL);
  if (a) return { effectiveOrigin: a, resolvedFrom: "PAYLOAD_SERVER_URL" };
  const b = normHttpsOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (b) return { effectiveOrigin: b, resolvedFrom: "NEXT_PUBLIC_SITE_URL" };
  const c = normHttpsOrigin(process.env.NEXT_PUBLIC_SERVER_URL);
  if (c) return { effectiveOrigin: c, resolvedFrom: "NEXT_PUBLIC_SERVER_URL" };
  if (process.env.VERCEL_ENV === "production") {
    const d = normHttpsOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    if (d) return { effectiveOrigin: d, resolvedFrom: "VERCEL_PROJECT_PRODUCTION_URL" };
  }
  const e = normHttpsOrigin(process.env.VERCEL_URL);
  if (e) return { effectiveOrigin: e, resolvedFrom: "VERCEL_URL" };
  return { effectiveOrigin: "http://localhost:3000", resolvedFrom: "fallback_localhost" };
}

function pgHostname(connectionString: string): string {
  try {
    const u = connectionString.replace(/^postgres(ql)?:/i, "https:");
    return new URL(u).hostname;
  } catch {
    return "(unparseable)";
  }
}

function sslForPostgresProbe(connectionString: string) {
  const h = pgHostname(connectionString).toLowerCase();
  if (h.includes("supabase") || h.includes("pooler.supabase.com")) {
    return { rejectUnauthorized: false };
  }
  if (/^(1|true|yes)$/i.test(trimmed(process.env.PAYLOAD_POSTGRES_TLS_INSECURE))) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function hintFromPgErr(err: unknown): { pgCode?: string; hint: string } {
  const e = err as { code?: string; message?: string };
  const code = e.code;
  const msg = (e.message || String(err)).slice(0, 400);
  if (code === "28P01") {
    return {
      pgCode: code,
      hint: "Wrong DB user or password (or pooler user format). URL-encode special characters in the password. Supabase session pooler often needs user `postgres.<project-ref>`.",
    };
  }
  if (code === "3D000") {
    return { pgCode: code, hint: "Database name in the URI does not exist on the server." };
  }
  if (code === "ENOTFOUND") {
    return { pgCode: code, hint: "Hostname did not resolve from this runtime — typo or DNS." };
  }
  if (code === "ETIMEDOUT" || msg.includes("timeout")) {
    return {
      pgCode: code,
      hint: "Connection timed out — security group, wrong port, or pooler overload. Prefer Supabase session pooler :5432 (not transaction :6543) for Payload.",
    };
  }
  if (code === "ECONNREFUSED") {
    return { pgCode: code, hint: "TCP refused — wrong host/port or service down." };
  }
  if (/SELF_SIGNED_CERT_IN_CHAIN|certificate/i.test(msg)) {
    return {
      pgCode: code,
      hint: "TLS verification failed. For non-Supabase Postgres on Vercel try PAYLOAD_POSTGRES_TLS_INSECURE=1 (temporary), or fix CA chain.",
    };
  }
  if (/relation .* does not exist/i.test(msg)) {
    return {
      pgCode: code,
      hint: "Connected but Payload tables are missing — run migrations / push schema against this database.",
    };
  }
  return { pgCode: code, hint: msg || "Unknown driver error — compare with `npm run test:pg` locally using the same URI." };
}

async function probePostgres(databaseUrl: string) {
  const { Client } = await import("pg");
  const host = pgHostname(databaseUrl);
  const t0 = Date.now();
  const client = new Client({
    connectionString: databaseUrl,
    ssl: sslForPostgresProbe(databaseUrl),
    connectionTimeoutMillis: 12_000,
  });
  try {
    await client.connect();
    await client.query("SELECT 1 AS ok");
    let usersCount: number | null = null;
    try {
      const r = await client.query<{ c: string }>(
        "SELECT count(*)::text AS c FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'",
      );
      if (r.rows[0]?.c === "1") {
        const u = await client.query<{ c: string }>("SELECT count(*)::text AS c FROM users");
        usersCount = Number.parseInt(u.rows[0]?.c ?? "0", 10);
      }
    } catch {
      usersCount = null;
    }
    await client.end();
    return {
      probe: "ok" as const,
      host,
      connectMs: Date.now() - t0,
      usersRowCount: usersCount,
    };
  } catch (err) {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    const { pgCode, hint } = hintFromPgErr(err);
    return {
      probe: "failed" as const,
      host,
      connectMs: Date.now() - t0,
      pgCode: pgCode ?? null,
      hint,
    };
  }
}

function blobTokenWarning(): string | null {
  const t = trimmed(process.env.BLOB_READ_WRITE_TOKEN);
  if (!t) return null;
  if (/^vercel_blob_rw_[a-z\d]+_[a-z\d]+$/i.test(t)) return null;
  return "BLOB_READ_WRITE_TOKEN is set but does not match vercel_blob_rw_* shape — Payload skips Blob plugin; unrelated to digest unless another error references storage.";
}

function poolerPortWarning(databaseUrl: string): string | null {
  try {
    const u = databaseUrl.replace(/^postgres(ql)?:/i, "https:");
    const port = new URL(u).port;
    if (port === "6543") {
      return "DATABASE_URL uses port 6543 (transaction pooler). Payload + Drizzle expect the Supabase session pooler on port 5432 — switch URI in Supabase Connect → Session pooler.";
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * One-off deploy debugging when `/admin` fails with a digest-only error in the browser.
 * Set `CMS_PREFLIGHT_SECRET` in Vercel (Production), redeploy, then GET:
 *   /api/cms-preflight?secret=<same value>
 * Optional: `&probe=1` runs a real Postgres TCP/auth/query from this lambda (same driver family as Payload).
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

  const wantProbe = /^(1|true|yes)$/i.test(trimmed(req.nextUrl.searchParams.get("probe")));

  const serverUrl = diagPayloadServerOrigin();
  const blobNote = blobTokenWarning();
  const portNote = postgresLike ? poolerPortWarning(databaseUrl) : null;

  let postgresProbe: Awaited<ReturnType<typeof probePostgres>> | { probe: "skipped"; reason: string } =
    { probe: "skipped", reason: "pass probe=1 to run (Postgres only)" };

  if (wantProbe) {
    if (postgresLike) {
      postgresProbe = await probePostgres(databaseUrl);
    } else if (libsqlOnDatabaseUrl || tursoSet) {
      postgresProbe = {
        probe: "skipped",
        reason: "Turso/libsql probe is not implemented here — verify token and URL in Turso dashboard; or test with a local Payload migrate.",
      };
    } else {
      postgresProbe = { probe: "skipped", reason: "No postgres:// DATABASE_URL to probe." };
    }
  }

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
    /** Effective Payload server origin (CSRF / cookies) — open /admin on this exact origin (www vs apex). */
    payloadServer_effectiveOrigin: serverUrl.effectiveOrigin,
    payloadServer_resolvedFrom: serverUrl.resolvedFrom,
    poolerPortWarning: portNote,
    blobTokenNote: blobNote,
    VERCEL: process.env.VERCEL ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
    postgresProbe,
    nextSteps:
      !postgresLike && !tursoSet && !libsqlOnDatabaseUrl
        ? "This deployment has no postgres:// DATABASE_URL and no TURSO_DATABASE_URL — /admin cannot connect. Set DATABASE_URL for Production + Runtime (not Build-only), redeploy, then run test:pg locally with the same URI."
        : secretLen < 32
          ? "Set PAYLOAD_SECRET to a random string of at least 32 characters for Production, redeploy."
          : wantProbe && postgresLike && postgresProbe.probe === "failed"
            ? `Postgres probe failed (${postgresProbe.pgCode ?? "no code"}): ${postgresProbe.hint}`
            : wantProbe && postgresLike && postgresProbe.probe === "ok"
              ? "Postgres reachable from Vercel. If /admin still shows a digest, check Vercel Logs for RSC/Payload errors, BLOB token, or open /admin using the same origin as payloadServer_effectiveOrigin."
              : "Add &probe=1 to run a live Postgres check from this deployment. If probe ok but /admin fails, search Vercel Logs for the digest; often RSC or Payload init after connect.",
  });
}
