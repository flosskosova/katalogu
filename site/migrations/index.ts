import * as migration_20260406_190058_initial from './20260406_190058_initial';
import * as migration_20260410_tool_suggestions_review_columns from './20260410_tool_suggestions_review_columns';
import * as migration_20260621_tool_suggestions_catalog_tool from './20260621_tool_suggestions_catalog_tool';

export const migrations = [
  {
    up: migration_20260406_190058_initial.up,
    down: migration_20260406_190058_initial.down,
    name: '20260406_190058_initial'
  },
  {
    up: migration_20260410_tool_suggestions_review_columns.up,
    down: migration_20260410_tool_suggestions_review_columns.down,
    name: '20260410_tool_suggestions_review_columns'
  },
  {
    up: migration_20260621_tool_suggestions_catalog_tool.up,
    down: migration_20260621_tool_suggestions_catalog_tool.down,
    name: '20260621_tool_suggestions_catalog_tool'
  },
];
