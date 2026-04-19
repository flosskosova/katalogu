import path from "path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import { buildConfig } from "payload";

import { SITE } from "@/lib/seo/site";
import { migrations } from "./migrations";
import {
  formatSmtpFromAddress,
  resolveSmtpSettings,
} from "./payload/email/resolveSmtpSettings";
import { GeneralSettings } from "./payload/globals/GeneralSettings";
import { CatalogCategories } from "./payload/collections/CatalogCategories";
import { CatalogTags } from "./payload/collections/CatalogTags";
import { CatalogTools } from "./payload/collections/CatalogTools";
import { CuratedCollections } from "./payload/collections/CuratedCollections";
import { Media } from "./payload/collections/Media";
import { Users } from "./payload/collections/Users";
import { ToolSuggestions } from "./payload/collections/ToolSuggestions";

const root = process.cwd();

/** Strip accidental quotes / newlines from Vercel env UI paste mistakes. */
function sanitizeEnvValue(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  let s = v.trim().replace(/\r\n/g, "").replace(/\n/g, "");
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

/**
 * `@payloadcms/storage-vercel-blob` throws at init if the token does not match this shape.
 * Only register the plugin when the token looks valid so `/admin` still loads.
 */
function isVercelBlobReadWriteTokenSyntaxOk(token: string): boolean {
  return /^vercel_blob_rw_[a-z\d]+_[a-z\d]+$/i.test(token);
}

function payloadPlugins() {
  const token = sanitizeEnvValue(process.env.BLOB_READ_WRITE_TOKEN);
  if (!token) return [];
  if (!isVercelBlobReadWriteTokenSyntaxOk(token)) {
    console.error(
      "[payload] BLOB_READ_WRITE_TOKEN is set but is not a valid `vercel_blob_rw_…` read/write token. Skipping Vercel Blob — fix or remove the env var. https://vercel.com/docs/storage/blob",
    );
    return [];
  }
  return [
    vercelBlobStorage({
      collections: { media: true },
      token,
      /** Vercel serverless upload size cap; client uploads go straight to Blob (storage-vercel-blob README). */
      clientUploads: true,
    }),
  ];
}

/**
 * Local dev: `file:…` (default).
 * Vercel/Turso: Turso docs use `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`; this project also accepts
 * `DATABASE_URL` + `DATABASE_AUTH_TOKEN` for compatibility.
 */
function sqliteClientOptions() {
  const url =
    sanitizeEnvValue(process.env.TURSO_DATABASE_URL) ||
    sanitizeEnvValue(process.env.DATABASE_URL) ||
    `file:${path.join(root, "data", "payload.sqlite")}`;
  const token =
    sanitizeEnvValue(process.env.TURSO_AUTH_TOKEN) ||
    sanitizeEnvValue(process.env.LIBSQL_AUTH_TOKEN) ||
    sanitizeEnvValue(process.env.DATABASE_AUTH_TOKEN);
  if (url.startsWith("libsql:") && !token) {
    throw new Error(
      "Turso requires an auth token. Set TURSO_AUTH_TOKEN (recommended) or DATABASE_AUTH_TOKEN for libsql:// URLs — Vercel → Settings → Environment Variables → Production, then redeploy.",
    );
  }
  return {
    url,
    ...(token ? { authToken: token } : {}),
  };
}

function isPostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//i.test(url);
}

/**
 * Real Vercel lambdas set both `VERCEL=1` and `VERCEL_URL`. Local `.env` copies often set `VERCEL=1`
 * alone — that must **not** skip TLS relaxation or local `next build` / `next start` hits
 * `SELF_SIGNED_CERT_IN_CHAIN` on Windows.
 */
function isLikelyVercelRuntime(): boolean {
  return process.env.VERCEL === "1" && Boolean(sanitizeEnvValue(process.env.VERCEL_URL));
}

/**
 * Pool sizing: use `VERCEL=1` only (do not require `VERCEL_URL`). If we key off
 * {@link isLikelyVercelRuntime}, missing `VERCEL_URL` makes `pool.max` 15 per worker and exhausts
 * Supabase session pooler → admin + suggest fail with generic DB errors.
 * TLS still uses {@link isLikelyVercelRuntime}.
 */
function isVercelPostgresPoolCap(): boolean {
  return process.env.VERCEL === "1";
}

/**
 * Supabase Postgres TLS query param (URI `sslmode`).
 * - Default **`require`** (with `uselibpqcompat` when we append params) so the URI does not force
 *   verify-full while the pg pool uses `ssl: { rejectUnauthorized: false }` — that combination
 *   still hit `SELF_SIGNED_CERT_IN_CHAIN` on some hosts when Vercel defaulted to verify-full.
 * - **`verify-full`** only when `PAYLOAD_POSTGRES_TLS_STRICT=1` and real Vercel (strict chain).
 * - Override: `PAYLOAD_POSTGRES_SSLMODE=verify-full|require|disable`.
 * - **Node/pg pool**: for Supabase hosts, `rejectUnauthorized: false` unless `TLS_STRICT`.
 * - `PAYLOAD_POSTGRES_TLS_INSECURE=1` → relax **any** Postgres host (non-Supabase too).
 */
function postgresTlsStrictEnv(): boolean {
  const v = sanitizeEnvValue(process.env.PAYLOAD_POSTGRES_TLS_STRICT);
  return Boolean(v && /^(1|true|yes)$/i.test(v));
}

function resolveSupabaseSslModeForQueryString(): string {
  const o = sanitizeEnvValue(process.env.PAYLOAD_POSTGRES_SSLMODE)?.toLowerCase();
  if (o === "verify-full" || o === "require" || o === "disable") return o;
  if (postgresTlsStrictEnv() && isLikelyVercelRuntime()) return "verify-full";
  return "require";
}

function isSupabasePostgresHost(url: string): boolean {
  if (/supabase\.co|pooler\.supabase\.com/i.test(url)) return true;
  try {
    const normalized = url.replace(/^postgres(ql)?:/i, "https:");
    const host = new URL(normalized).hostname;
    return (
      host.endsWith(".supabase.co") ||
      host === "supabase.co" ||
      host.endsWith(".pooler.supabase.com") ||
      host === "pooler.supabase.com"
    );
  } catch {
    return false;
  }
}

function withSupabasePostgresSslMode(url: string): string {
  if (!isSupabasePostgresHost(url)) return url;
  const mode = resolveSupabaseSslModeForQueryString();
  let out = url;
  if (/[?&]sslmode=/i.test(out)) {
    out = out.replace(/([?&]sslmode=)[^&]*/i, `$1${mode}`);
  } else {
    out = out.includes("?") ? `${out}&sslmode=${mode}` : `${out}?sslmode=${mode}`;
  }
  if (mode === "require" && !/([?&])uselibpqcompat=/i.test(out)) {
    out += "&uselibpqcompat=true";
  }
  return out;
}

function postgresTlsInsecureExplicit(): boolean {
  const v = sanitizeEnvValue(process.env.PAYLOAD_POSTGRES_TLS_INSECURE);
  return Boolean(v && /^(1|true|yes)$/i.test(v));
}

/** When set, skip pool-level TLS relaxation for Supabase (full cert verification; may hit SELF_SIGNED_CERT). */
function postgresSupabaseTlsStrictEnabled(): boolean {
  return postgresTlsStrictEnv();
}

/** pg Pool `ssl` — Supabase: relax Node cert verification by default (encrypted, avoids SELF_SIGNED_CERT_IN_CHAIN). */
function postgresSslForPool(pgUrl: string): { rejectUnauthorized: boolean } | undefined {
  if (postgresTlsInsecureExplicit()) {
    return { rejectUnauthorized: false };
  }
  if (postgresSupabaseTlsStrictEnabled()) {
    return undefined;
  }
  if (isSupabasePostgresHost(pgUrl)) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

/**
 * Auto-pushing schema is helpful locally, but production requests should not perform
 * database-management work on cold start. Enable explicitly only when needed.
 */
function shouldPushPostgresSchema(): boolean {
  const explicit = sanitizeEnvValue(process.env.PAYLOAD_POSTGRES_PUSH);
  if (explicit != null) return /^(1|true|yes|on)$/i.test(explicit);
  return process.env.NODE_ENV !== "production";
}

function resolvePayloadSecret(): string {
  const secret = sanitizeEnvValue(process.env.PAYLOAD_SECRET);
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "CHANGE_ME_DEV_ONLY") {
      console.error(
        "[payload] PAYLOAD_SECRET is missing/weak in production. Set a strong random value (>= 32 chars) in Vercel env vars.",
      );
    }
    if (secret && secret.length < 32) {
      console.error(
        "[payload] PAYLOAD_SECRET is short in production. Use a strong random value (>= 32 chars).",
      );
    }
  }
  return secret || "CHANGE_ME_DEV_ONLY";
}

/**
 * Payload uses this for cookies, CSRF, and auth. It MUST match the browser origin.
 *
 * In **development**, do not use `NEXT_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_SITE_URL` here: those are
 * often copied from production (e.g. Vercel) while you run `next dev` on localhost. That mismatch
 * prevents the auth cookie from being sent → `req.user` is empty → PATCH `/api/users/...` returns 403
 * (“You are not allowed to perform this action”).
 *
 * Override local origin only if needed: `PAYLOAD_SERVER_URL=https://your-tunnel.ngrok.io`
 *
 * In **production**, `PAYLOAD_SERVER_URL` wins over `NEXT_PUBLIC_*` so Payload `serverURL` (cookies,
 * CSRF) matches the real host even if an older build inlined stale public env values.
 */
function normalizedHttpsOrigin(raw: string | undefined): string | undefined {
  const s = sanitizeEnvValue(raw);
  if (!s) return undefined;
  let u = s.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u.replace(/^\/+/, "")}`;
  }
  try {
    return new URL(u).origin;
  } catch {
    return undefined;
  }
}

function resolvePayloadServerURL(): string {
  if (process.env.NODE_ENV !== "production") {
    const devOverride =
      sanitizeEnvValue(process.env.PAYLOAD_SERVER_URL) ||
      sanitizeEnvValue(process.env.PAYLOAD_DEV_SERVER_URL);
    if (devOverride) {
      return devOverride.replace(/\/+$/, "");
    }
    const port = sanitizeEnvValue(process.env.PORT) || "3000";
    return `http://localhost:${port}`;
  }

  /**
   * Prefer `NEXT_PUBLIC_SITE_URL` over `NEXT_PUBLIC_SERVER_URL`: teams often leave the latter as
   * `*.vercel.app` while the real traffic (and cookies) use a custom domain like `catalog.flossk.org`.
   * Wrong order breaks Payload `serverURL` / CSRF for `/admin` on the public host.
   */
  const explicit =
    normalizedHttpsOrigin(process.env.PAYLOAD_SERVER_URL) ||
    normalizedHttpsOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizedHttpsOrigin(process.env.NEXT_PUBLIC_SERVER_URL);
  if (explicit) {
    return explicit;
  }
  /**
   * Production deploys on a custom domain: `VERCEL_URL` is often `*.vercel.app`, which breaks
   * Payload cookies/CSRF for `https://your-domain`. Vercel exposes the canonical production host
   * here (no scheme). Skip on preview so branch/preview URLs still use `VERCEL_URL`.
   */
  if (process.env.VERCEL_ENV === "production") {
    const fromProd = normalizedHttpsOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    if (fromProd) return fromProd;
  }
  const fromVercelUrl = normalizedHttpsOrigin(process.env.VERCEL_URL);
  if (fromVercelUrl) return fromVercelUrl;
  return "http://localhost:3000";
}

/**
 * `payload/dist/auth/extractJWT.js` only reads the auth cookie when `Origin` is absent or is listed in
 * `config.csrf`. `serverURL` is pushed onto `csrf` during sanitize, but the browser `Origin` must match
 * exactly — e.g. `http://127.0.0.1:3000` ≠ `http://localhost:3000`. Listing both avoids 403 saves and
 * logout that never clears the cookie.
 */
function originFromUrlish(urlish: string | undefined): string | undefined {
  const raw = sanitizeEnvValue(urlish);
  if (!raw) return undefined;
  let s = raw.replace(/\/+$/, "");
  if (!s) return undefined;
  try {
    if (!/^https?:\/\//i.test(s)) {
      s = `https://${s}`;
    }
    return new URL(s).origin;
  } catch {
    return undefined;
  }
}

/** Comma-separated origins, e.g. `https://www.example.com` for apex+www during DNS moves. */
function originsFromCommaEnv(name: string): string[] {
  const raw = sanitizeEnvValue(process.env[name]);
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const o = originFromUrlish(part.trim());
    if (o) out.push(o);
  }
  return out;
}

function resolvePayloadExtraCsrfOrigins(): string[] {
  const out = new Set<string>();
  const add = (o: string | undefined) => {
    if (o) out.add(o);
  };

  const port = sanitizeEnvValue(process.env.PORT) || "3000";

  if (process.env.NODE_ENV !== "production") {
    add(`http://localhost:${port}`);
    add(`http://127.0.0.1:${port}`);
    add(originFromUrlish(process.env.PAYLOAD_SERVER_URL));
    add(originFromUrlish(process.env.PAYLOAD_DEV_SERVER_URL));
    add(originFromUrlish(process.env.NEXT_PUBLIC_SERVER_URL));
    add(originFromUrlish(process.env.NEXT_PUBLIC_SITE_URL));
  } else {
    /** Always align with `serverURL` (includes `PAYLOAD_SERVER_URL` precedence). */
    add(originFromUrlish(resolvePayloadServerURL()));
    add(originFromUrlish(process.env.NEXT_PUBLIC_SERVER_URL));
    add(originFromUrlish(process.env.NEXT_PUBLIC_SITE_URL));
    add(originFromUrlish(process.env.PAYLOAD_SERVER_URL));
    add(originFromUrlish(process.env.VERCEL_PROJECT_PRODUCTION_URL));
    add(originFromUrlish(process.env.VERCEL_BRANCH_URL));
    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel) {
      const host = vercel.replace(/^https?:\/\//i, "");
      add(`https://${host}`);
    }
    for (const o of originsFromCommaEnv("PAYLOAD_CSRF_EXTRA_ORIGINS")) add(o);
  }

  return [...out];
}

/**
 * Supabase session pooler caps concurrent sessions; each Vercel lambda is its own process and
 * many concurrent invocations × `pool.max` exhausts the pooler (`EMAXCONNSESSION`).
 * Default **1** whenever `VERCEL=1` (see {@link isVercelPostgresPoolCap}). Raise with
 * `PAYLOAD_POSTGRES_POOL_MAX` only if your pooler limit allows it (catalog reads use per-request `React.cache()`).
 */
function postgresPoolMax(): number {
  const raw = sanitizeEnvValue(process.env.PAYLOAD_POSTGRES_POOL_MAX);
  if (raw && /^\d+$/.test(raw)) {
    const n = Number.parseInt(raw, 10);
    if (n >= 1 && n <= 50) {
      if (isVercelPostgresPoolCap() && n > 2) {
        console.warn(
          `[payload] PAYLOAD_POSTGRES_POOL_MAX=${n} on Vercel is unsafe for Supabase session pooler; using 1. Unset or set ≤2.`,
        );
        return 1;
      }
      return n;
    }
  }
  return isVercelPostgresPoolCap() ? 1 : 15;
}

/** Shorter idle timeout on Vercel so pooler sessions are released sooner between requests. */
function postgresPoolIdleTimeoutMillis(): number {
  return isVercelPostgresPoolCap() ? 10_000 : 30_000;
}

function dbAdapter() {
  const databaseUrl = sanitizeEnvValue(process.env.DATABASE_URL);
  /** Fail fast on Vercel production instead of falling through to file SQLite (opaque admin / digest errors). */
  if (isVercelPostgresPoolCap() && process.env.NODE_ENV === "production") {
    if (!databaseUrl) {
      throw new Error(
        "[payload] DATABASE_URL is unset on Vercel production. Set Postgres (Supabase session pooler URI) or libsql:// (Turso) in Vercel → Environment Variables → Production, then redeploy.",
      );
    }
    if (!isPostgresUrl(databaseUrl) && !databaseUrl.startsWith("libsql:")) {
      const hint = databaseUrl.length > 40 ? `${databaseUrl.slice(0, 40)}…` : databaseUrl;
      throw new Error(
        `[payload] On Vercel production DATABASE_URL must be postgres:// or libsql:// (received: ${hint}). Fix env and redeploy.`,
      );
    }
  }
  if (databaseUrl && isPostgresUrl(databaseUrl)) {
    const pgUrl = withSupabasePostgresSslMode(databaseUrl);
    const ssl = postgresSslForPool(pgUrl);
    return postgresAdapter({
      pool: {
        connectionString: pgUrl,
        max: postgresPoolMax(),
        connectionTimeoutMillis: 25_000,
        idleTimeoutMillis: postgresPoolIdleTimeoutMillis(),
        ...(ssl ? { ssl } : {}),
      },
      /**
       * For a fresh Postgres DB in local/dev, schema push is convenient.
       *
       * In production, disable it by default so normal requests (like the public suggest form)
       * don't trigger schema-management work on startup. If you intentionally need a one-time push,
       * set PAYLOAD_POSTGRES_PUSH=true for that deployment/job.
       *
       * Supabase: if admin saves return 403 (“not allowed”), Row Level Security on `public` tables
       * can block reads of `users` used for permission checks (Payload `overrideAccess` does not
       * bypass Postgres RLS). Keep Payload tables private by revoking `anon`/`authenticated`
       * grants, and disable RLS on those tables unless you use a DB role with BYPASSRLS.
       * Run `npm run check:pg-rls` to audit/fix the expected Postgres posture.
       */
      push: shouldPushPostgresSchema(),
    });
  }

  return sqliteAdapter({
    client: sqliteClientOptions(),
    prodMigrations: migrations as unknown as never,
  });
}

export default buildConfig({
  serverURL: resolvePayloadServerURL(),
  csrf: resolvePayloadExtraCsrfOrigins(),
  secret: resolvePayloadSecret(),
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "— OpenCatalog CMS",
    },
    components: {
      graphics: {
        Logo: "@/payload/components/AdminLoginLogo#AdminLoginLogo",
      },
      /** Sidebar footer — this is the primary “Log out” control in Payload 3. */
      logout: {
        Button: "@/payload/components/AdminLogoutLink#AdminLogoutButton",
      },
      /** Top header — backup if a theme/layout hides the sidebar control. */
      actions: ["@/payload/components/AdminLogoutLink#AdminLogoutHeaderAction"],
    },
  },
  editor: lexicalEditor(),
  collections: [
    Users,
    Media,
    CatalogCategories,
    CatalogTags,
    CatalogTools,
    CuratedCollections,
    ToolSuggestions,
  ],
  globals: [GeneralSettings],
  db: dbAdapter(),
  sharp,
  /** General Settings (SMTP) or `SMTP_*` env vars; otherwise logs only. */
  email: ({ payload }) => ({
    name: "smtp",
    defaultFromAddress:
      process.env.SMTP_FROM_EMAIL?.trim() || "noreply@example.invalid",
    defaultFromName: process.env.SMTP_FROM_NAME?.trim() || SITE.name,
    sendEmail: async (message) => {
      const cfg = await resolveSmtpSettings(payload);
      if (!cfg) {
        payload.logger.info({
          msg: "[email] SMTP disabled — enable in Settings → General Settings or set SMTP_HOST/SMTP_USER/SMTP_PASS",
          to: message.to,
          subject: message.subject,
        });
        return;
      }
      const { default: nodemailer } = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.password },
      });
      await transport.sendMail({
        ...message,
        from: message.from ?? formatSmtpFromAddress(cfg),
      });
    },
  }),
  graphQL: {
    disable: true,
  },
  /**
   * Vercel: `media` uploads need Blob when `BLOB_READ_WRITE_TOKEN` is set (Vercel → Storage → Blob).
   * https://payloadcms.com/docs/upload/storage-adapters
   */
  plugins: payloadPlugins(),
});
