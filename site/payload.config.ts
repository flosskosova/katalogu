import path from "path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
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

/** Supabase Postgres URLs should enforce TLS; missing sslmode can cause opaque connection failures. */
function withSupabasePostgresSslMode(url: string): string {
  if (!/supabase\.co/i.test(url)) return url;
  if (/[?&]sslmode=/i.test(url)) return url;
  return url.includes("?") ? `${url}&sslmode=require` : `${url}?sslmode=require`;
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
      throw new Error(
        "PAYLOAD_SECRET is required in production and cannot use the development fallback.",
      );
    }
    if (secret.length < 32) {
      throw new Error(
        "PAYLOAD_SECRET is too short for production. Use a strong random value (>= 32 chars).",
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
 */
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

  const explicit =
    sanitizeEnvValue(process.env.NEXT_PUBLIC_SERVER_URL) ||
    sanitizeEnvValue(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
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
  }

  return [...out];
}

function dbAdapter() {
  const databaseUrl = sanitizeEnvValue(process.env.DATABASE_URL);
  if (databaseUrl && isPostgresUrl(databaseUrl)) {
    const pgUrl = withSupabasePostgresSslMode(databaseUrl);
    return postgresAdapter({
      pool: {
        connectionString: pgUrl,
        max: 15,
        connectionTimeoutMillis: 25_000,
        idleTimeoutMillis: 30_000,
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
});
