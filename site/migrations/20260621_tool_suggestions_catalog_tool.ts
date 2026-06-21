import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-sqlite";

function isPostgresUrl(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return /^postgres(ql)?:\/\//i.test(url);
}

function sslForPostgres(connectionString: string) {
  try {
    const u = connectionString.replace(/^postgres(ql)?:/i, "https:");
    const h = new URL(u).hostname.toLowerCase();
    if (h.includes("supabase") || h.includes("pooler.supabase.com")) {
      return { rejectUnauthorized: false };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function upPostgres(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for Postgres migration.");
  }
  const { Client } = await import("pg");
  const client = new Client({
    connectionString,
    ssl: sslForPostgres(connectionString),
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
  } finally {
    await client.end();
  }
}

/**
 * Adds catalogTool link on tool suggestions (SQLite + Postgres).
 * Postgres production: run `npm run postgres:sql:catalog-tool-link` if migrate is not used.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (isPostgresUrl()) {
    await upPostgres();
    return;
  }
  await db.run(
    sql`ALTER TABLE \`tool_suggestions\` ADD COLUMN \`catalog_tool_id\` integer REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE set null;`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`tool_suggestions_catalog_tool_idx\` ON \`tool_suggestions\` (\`catalog_tool_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  void db;
}
