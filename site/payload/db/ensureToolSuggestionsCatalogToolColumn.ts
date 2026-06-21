/**
 * Manual / preflight-only Postgres patch for `tool_suggestions.catalog_tool_id`.
 *
 * Do NOT call from Payload init, collection hooks, or getPayload — a separate pg Client
 * steals Supabase session-pooler slots and causes EMAXCONNSESSION on Vercel.
 * Production schema is applied via `prodMigrations` in payload.config.ts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

function isPostgresUrl(url: string | undefined): boolean {
  return Boolean(url && /^postgres(ql)?:\/\//i.test(url));
}

function sslForPostgres(connectionString: string) {
  try {
    const u = connectionString.replace(/^postgres(ql)?:\/\//i, "https:");
    const h = new URL(u).hostname.toLowerCase();
    if (h.includes("supabase") || h.includes("pooler.supabase.com")) {
      return { rejectUnauthorized: false };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function postgresPatchSql(): string {
  return readFileSync(
    path.join(process.cwd(), "scripts/sql/add-tool-suggestions-catalog-tool-id.sql"),
    "utf8",
  );
}

/** One-off repair via Supabase SQL editor or `npm run postgres:sql:catalog-tool-link`. */
export async function ensureToolSuggestionsCatalogToolColumn(
  connectionString = process.env.DATABASE_URL?.trim(),
): Promise<void> {
  if (!isPostgresUrl(connectionString)) return;

  const { Client } = await import("pg");
  const client = new Client({
    connectionString,
    ssl: sslForPostgres(connectionString!),
    connectionTimeoutMillis: 25_000,
  });
  await client.connect();
  try {
    await client.query(postgresPatchSql());
  } finally {
    await client.end();
  }
}
