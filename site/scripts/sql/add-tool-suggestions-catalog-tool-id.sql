-- Links accepted tool suggestions to catalog-tools (Payload relationship: catalogTool).
-- Safe to run multiple times (IF NOT EXISTS).

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
