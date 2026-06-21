import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-sqlite";
import { ensureToolSuggestionsCatalogToolColumn } from "../payload/db/ensureToolSuggestionsCatalogToolColumn";

function isPostgresUrl(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return /^postgres(ql)?:\/\//i.test(url);
}

/**
 * Adds catalogTool link on tool suggestions (SQLite + Postgres).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (isPostgresUrl()) {
    await ensureToolSuggestionsCatalogToolColumn();
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
