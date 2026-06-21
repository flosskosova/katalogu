import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-sqlite";

/**
 * Links accepted tool suggestions to the catalog-tools row created on accept (SQLite).
 * Postgres deployments use `push: true` and pick up schema from the collection config.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
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
