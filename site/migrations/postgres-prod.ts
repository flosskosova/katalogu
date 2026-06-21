import * as migration_20260621_tool_suggestions_catalog_tool from "./20260621_tool_suggestions_catalog_tool";

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
];
