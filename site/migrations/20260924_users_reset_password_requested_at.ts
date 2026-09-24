import { sql } from "drizzle-orm";
import { MigrateDownArgs, MigrateUpArgs, sql as sqliteSql } from "@payloadcms/db-sqlite";

type MigrationDb = {
  run?: (query: unknown) => Promise<unknown>;
  execute?: (query: unknown) => Promise<unknown>;
};

const POSTGRES_PATCH = `
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_password_requested_at timestamp(3) with time zone;
`;

function isPostgresUrl(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return /^postgres(ql)?:\/\//i.test(url);
}

/**
 * Payload 3.90 stores the forgot-password throttle timestamp on auth users.
 * Existing Postgres databases do not have this column, so admin login and
 * staff notification lookups fail until it is added.
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
    sqliteSql`ALTER TABLE \`users\` ADD COLUMN \`reset_password_requested_at\` text;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  void db;
}
