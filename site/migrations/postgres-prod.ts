import * as migration_20260621_tool_suggestions_catalog_tool from "./20260621_tool_suggestions_catalog_tool";
import * as migration_20260924_users_reset_password_requested_at from "./20260924_users_reset_password_requested_at";

/**
 * Postgres production migrations (when push is disabled).
 * Only includes patches safe to run on an existing live DB — not the SQLite initial schema.
 */
export const postgresProdMigrations = [
  {
    up: migration_20260621_tool_suggestions_catalog_tool.up,
    down: migration_20260621_tool_suggestions_catalog_tool.down,
    name: "20260621_tool_suggestions_catalog_tool",
  },
  {
    up: migration_20260924_users_reset_password_requested_at.up,
    down: migration_20260924_users_reset_password_requested_at.down,
    name: "20260924_users_reset_password_requested_at",
  },
];
