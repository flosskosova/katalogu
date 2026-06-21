import { sql } from "drizzle-orm";
import { MigrateDownArgs, MigrateUpArgs, sql as sqliteSql } from "@payloadcms/db-sqlite";

type MigrationDb = {
  run?: (query: unknown) => Promise<unknown>;
  execute?: (query: unknown) => Promise<unknown>;
};

const POSTGRES_PATCH = `
ALTER TABLE tool_suggestions
  ADD COLUMN IF NOT EXISTS catalog_tool_id integer;

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

CREATE INDEX IF NOT EXISTS tool_suggestions_catalog_tool_idx
  ON tool_suggestions (catalog_tool_id);
`;

function isPostgresUrl(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return /^postgres(ql)?:\/\//i.test(url);
}

/**
 * Adds catalogTool link on tool suggestions.
 * Postgres prodMigrations use Payload's pool (no extra pg Client).
 */
export async function up(args: MigrateUpArgs): Promise<void> {
  const db = args.db as MigrationDb;
  if (isPostgresUrl()) {
    if (typeof db.execute !== "function") {
      throw new Error("Postgres migration expected drizzle db.execute");
    }
    await db.execute(sql.raw(POSTGRES_PATCH));
    return;
  }
  await db.run!(
    sqliteSql`ALTER TABLE \`tool_suggestions\` ADD COLUMN \`catalog_tool_id\` integer REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE set null;`,
  );
  await db.run!(
    sqliteSql`CREATE INDEX IF NOT EXISTS \`tool_suggestions_catalog_tool_idx\` ON \`tool_suggestions\` (\`catalog_tool_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  void db;
}
