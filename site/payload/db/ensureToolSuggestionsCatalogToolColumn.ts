/**
 * Idempotent Postgres patch: `tool_suggestions.catalog_tool_id` for Payload `catalogTool`.
 * Production keeps `PAYLOAD_POSTGRES_PUSH=false`, so this must run outside drizzle push.
 */
let ensured = false;
let inflight: Promise<void> | null = null;

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

export async function ensureToolSuggestionsCatalogToolColumn(
  connectionString = process.env.DATABASE_URL?.trim(),
): Promise<void> {
  if (ensured) return;
  if (inflight) return inflight;
  if (!isPostgresUrl(connectionString)) {
    ensured = true;
    return;
  }

  inflight = (async () => {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString,
      ssl: sslForPostgres(connectionString!),
      connectionTimeoutMillis: 25_000,
    });
    await client.connect();
    try {
      await client.query(`
        ALTER TABLE tool_suggestions
          ADD COLUMN IF NOT EXISTS catalog_tool_id integer;
      `);
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'tool_suggestions_catalog_tool_id_fkey'
          ) THEN
            ALTER TABLE tool_suggestions
              ADD CONSTRAINT tool_suggestions_catalog_tool_id_fkey
              FOREIGN KEY (catalog_tool_id) REFERENCES catalog_tools(id)
              ON DELETE SET NULL;
          END IF;
        END $$;
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS tool_suggestions_catalog_tool_idx
          ON tool_suggestions (catalog_tool_id);
      `);
      ensured = true;
    } finally {
      await client.end();
    }
  })()
    .catch((err) => {
      ensured = false;
      console.error(
        "[payload] ensureToolSuggestionsCatalogToolColumn failed:",
        err instanceof Error ? err.message : err,
      );
      throw err;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
