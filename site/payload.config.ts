import path from "path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import { buildConfig } from "payload";

import { SITE } from "@/lib/seo/site";
import { migrations } from "./migrations";
import { resolveSmtpSettings } from "./payload/email/resolveSmtpSettings";
import { GeneralSettings } from "./payload/globals/GeneralSettings";
import { CatalogCategories } from "./payload/collections/CatalogCategories";
import { CatalogTags } from "./payload/collections/CatalogTags";
import { CatalogTools } from "./payload/collections/CatalogTools";
import { CuratedCollections } from "./payload/collections/CuratedCollections";
import { Media } from "./payload/collections/Media";
import { Users } from "./payload/collections/Users";

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

/**
 * Payload uses this for cookies / CSRF. Must match the browser origin in production.
 * Prefer explicit `NEXT_PUBLIC_SERVER_URL`; fall back to public site URL or Vercel’s hostname.
 */
function resolvePayloadServerURL(): string {
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

function dbAdapter() {
  const databaseUrl = sanitizeEnvValue(process.env.DATABASE_URL);
  if (databaseUrl && isPostgresUrl(databaseUrl)) {
    return postgresAdapter({
      pool: { connectionString: databaseUrl },
      /**
       * For a fresh Supabase Postgres DB, we prefer pushing schema automatically instead of
       * reusing sqlite-generated migrations (they are not compatible: db.run vs db.execute).
       */
      push: true,
    });
  }

  return sqliteAdapter({
    client: sqliteClientOptions(),
    prodMigrations: migrations as unknown as never,
  });
}

export default buildConfig({
  serverURL: resolvePayloadServerURL(),
  secret: process.env.PAYLOAD_SECRET || "CHANGE_ME_DEV_ONLY",
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "— OpenCatalog CMS",
    },
    components: {
      graphics: {
        Logo: "@/payload/components/AdminLoginLogo#AdminLoginLogo",
      },
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
        from:
          message.from ??
          `"${cfg.fromName}" <${cfg.fromEmail}>`,
      });
    },
  }),
  graphQL: {
    disable: true,
  },
});
