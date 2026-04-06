import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`role\` text DEFAULT 'editor' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`)
  await db.run(sql`CREATE TABLE \`catalog_categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`summary\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`parent_id\` integer,
  	\`icon_id\` integer,
  	\`featured\` integer DEFAULT false,
  	\`sort_order\` numeric DEFAULT 0,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`canonical_slug\` text,
  	\`og_image_id\` integer,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`visible_on_website\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`catalog_categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`catalog_categories_slug_idx\` ON \`catalog_categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`catalog_categories_parent_idx\` ON \`catalog_categories\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_categories_icon_idx\` ON \`catalog_categories\` (\`icon_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_categories_og_image_idx\` ON \`catalog_categories\` (\`og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_categories_updated_at_idx\` ON \`catalog_categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`catalog_categories_created_at_idx\` ON \`catalog_categories\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`catalog_tags\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`description\` text,
  	\`tag_type\` text DEFAULT 'editorial',
  	\`sort_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`catalog_tags_slug_idx\` ON \`catalog_tags\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tags_updated_at_idx\` ON \`catalog_tags\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tags_created_at_idx\` ON \`catalog_tags\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`catalog_tools_strengths\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`line\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`catalog_tools_strengths_order_idx\` ON \`catalog_tools_strengths\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_strengths_parent_id_idx\` ON \`catalog_tools_strengths\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`catalog_tools_limitations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`line\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`catalog_tools_limitations_order_idx\` ON \`catalog_tools_limitations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_limitations_parent_id_idx\` ON \`catalog_tools_limitations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`catalog_tools_alternatives\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`line\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`catalog_tools_alternatives_order_idx\` ON \`catalog_tools_alternatives\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_alternatives_parent_id_idx\` ON \`catalog_tools_alternatives\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`catalog_tools_platforms\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`platform\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`catalog_tools_platforms_order_idx\` ON \`catalog_tools_platforms\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_platforms_parent_id_idx\` ON \`catalog_tools_platforms\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`catalog_tools\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`visible_on_website\` integer DEFAULT true,
  	\`category_id\` integer NOT NULL,
  	\`subcategory\` text,
  	\`rank\` text DEFAULT 'also-strong' NOT NULL,
  	\`editorial_weight\` numeric DEFAULT 0,
  	\`featured\` integer DEFAULT false,
  	\`summary\` text NOT NULL,
  	\`long_description\` text,
  	\`why_included\` text,
  	\`best_for\` text,
  	\`target_users\` text,
  	\`replaces_proprietary\` text,
  	\`license\` text NOT NULL,
  	\`open_source_status\` text DEFAULT 'osi-approved',
  	\`maintenance_status\` text DEFAULT 'active' NOT NULL,
  	\`maturity\` text DEFAULT 'established' NOT NULL,
  	\`official_site\` text NOT NULL,
  	\`source_repo\` text NOT NULL,
  	\`docs_url\` text,
  	\`privacy_focused\` integer DEFAULT false,
  	\`self_hosted\` integer DEFAULT false,
  	\`beginner_friendly\` integer DEFAULT false,
  	\`developer_focused\` integer DEFAULT false,
  	\`end_user_focused\` integer DEFAULT false,
  	\`logo_id\` integer,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`canonical_slug\` text,
  	\`og_image_id\` integer,
  	\`scheduled_publish_at\` text,
  	\`quality_warnings\` text,
  	\`published_at\` text,
  	\`created_by_id\` integer,
  	\`updated_by_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`catalog_categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`updated_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`catalog_tools_slug_idx\` ON \`catalog_tools\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_category_idx\` ON \`catalog_tools\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_logo_idx\` ON \`catalog_tools\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_og_image_idx\` ON \`catalog_tools\` (\`og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_created_by_idx\` ON \`catalog_tools\` (\`created_by_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_updated_by_idx\` ON \`catalog_tools\` (\`updated_by_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_updated_at_idx\` ON \`catalog_tools\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_created_at_idx\` ON \`catalog_tools\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`catalog_tools_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`catalog_tags_id\` integer,
  	\`media_id\` integer,
  	\`catalog_tools_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`catalog_tags_id\`) REFERENCES \`catalog_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`catalog_tools_id\`) REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`catalog_tools_rels_order_idx\` ON \`catalog_tools_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_rels_parent_idx\` ON \`catalog_tools_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_rels_path_idx\` ON \`catalog_tools_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_rels_catalog_tags_id_idx\` ON \`catalog_tools_rels\` (\`catalog_tags_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_rels_media_id_idx\` ON \`catalog_tools_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`catalog_tools_rels_catalog_tools_id_idx\` ON \`catalog_tools_rels\` (\`catalog_tools_id\`);`)
  await db.run(sql`CREATE TABLE \`curated_collections_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tool_id\` integer NOT NULL,
  	\`sort_order\` numeric DEFAULT 0,
  	\`blurb\` text,
  	FOREIGN KEY (\`tool_id\`) REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`curated_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`curated_collections_items_order_idx\` ON \`curated_collections_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`curated_collections_items_parent_id_idx\` ON \`curated_collections_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`curated_collections_items_tool_idx\` ON \`curated_collections_items\` (\`tool_id\`);`)
  await db.run(sql`CREATE TABLE \`curated_collections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`description\` text,
  	\`display_style\` text DEFAULT 'grid',
  	\`featured\` integer DEFAULT false,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`curated_collections_slug_idx\` ON \`curated_collections\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`curated_collections_updated_at_idx\` ON \`curated_collections\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`curated_collections_created_at_idx\` ON \`curated_collections\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`catalog_categories_id\` integer,
  	\`catalog_tags_id\` integer,
  	\`catalog_tools_id\` integer,
  	\`curated_collections_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`catalog_categories_id\`) REFERENCES \`catalog_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`catalog_tags_id\`) REFERENCES \`catalog_tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`catalog_tools_id\`) REFERENCES \`catalog_tools\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`curated_collections_id\`) REFERENCES \`curated_collections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_catalog_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`catalog_categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_catalog_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`catalog_tags_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_catalog_tools_id_idx\` ON \`payload_locked_documents_rels\` (\`catalog_tools_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_curated_collections_id_idx\` ON \`payload_locked_documents_rels\` (\`curated_collections_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`catalog_categories\`;`)
  await db.run(sql`DROP TABLE \`catalog_tags\`;`)
  await db.run(sql`DROP TABLE \`catalog_tools_strengths\`;`)
  await db.run(sql`DROP TABLE \`catalog_tools_limitations\`;`)
  await db.run(sql`DROP TABLE \`catalog_tools_alternatives\`;`)
  await db.run(sql`DROP TABLE \`catalog_tools_platforms\`;`)
  await db.run(sql`DROP TABLE \`catalog_tools\`;`)
  await db.run(sql`DROP TABLE \`catalog_tools_rels\`;`)
  await db.run(sql`DROP TABLE \`curated_collections_items\`;`)
  await db.run(sql`DROP TABLE \`curated_collections\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
