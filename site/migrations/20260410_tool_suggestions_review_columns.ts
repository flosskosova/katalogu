import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-sqlite";

/**
 * Adds editorial review fields for tool suggestions (SQLite).
 * Postgres deployments use `push: true` and pick up schema from the collection config.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`tool_suggestions\` ADD COLUMN \`reviewed_category_id\` integer REFERENCES \`catalog_categories\`(\`id\`) ON UPDATE no action ON DELETE set null;`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`tool_suggestions_reviewed_category_idx\` ON \`tool_suggestions\` (\`reviewed_category_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`tool_suggestions\` ADD COLUMN \`review_note\` text;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite cannot drop columns reliably without table rebuild; leave columns in place.
  void db;
}
