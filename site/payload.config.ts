import path from "path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import { buildConfig } from "payload";

import { SITE } from "@/lib/seo/site";
import { migrations } from "./migrations";
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
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
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
  db: dbAdapter(),
  sharp,
  /** Explicit adapter: same behavior as Payload’s default, but avoids startup WARN in logs. */
  email: ({ payload }) => ({
    name: "console",
    defaultFromAddress:
      process.env.SMTP_FROM_EMAIL?.trim() || "noreply@example.invalid",
    defaultFromName:
      process.env.SMTP_FROM_NAME?.trim() || SITE.name,
    sendEmail: async (message) => {
      payload.logger.info({
        msg: "[email] Console adapter — not sent (configure SMTP / Resend for real mail)",
        to: message.to,
        subject: message.subject,
      });
    },
  }),
  graphQL: {
    disable: true,
  },
});
