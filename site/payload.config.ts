import path from "path";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import { buildConfig } from "payload";

import { CatalogCategories } from "./payload/collections/CatalogCategories";
import { CatalogTags } from "./payload/collections/CatalogTags";
import { CatalogTools } from "./payload/collections/CatalogTools";
import { CuratedCollections } from "./payload/collections/CuratedCollections";
import { Media } from "./payload/collections/Media";
import { Users } from "./payload/collections/Users";

const root = process.cwd();

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  secret: process.env.PAYLOAD_SECRET || "CHANGE_ME_DEV_ONLY",
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "— OpenCatalog CMS",
    },
    components: {
      graphics: {
        Logo: "@/payload/components/AdminLoginLogo#AdminLoginLogo",
      },
    },
  },
  editor: lexicalEditor(),
  collections: [
    Users,
    Media,
    CatalogCategories,
    CatalogTags,
    CatalogTools,
    CuratedCollections,
  ],
  db: sqliteAdapter({
    client: {
      url:
        process.env.DATABASE_URL ||
        `file:${path.join(root, "data", "payload.sqlite")}`,
    },
  }),
  sharp,
  graphQL: {
    disable: true,
  },
});
