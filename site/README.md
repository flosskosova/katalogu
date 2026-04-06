# OpenCatalog (web)

Next.js + TypeScript + Tailwind public catalog with an embedded **[Payload CMS 3](https://payloadcms.com/)** admin. Editors manage tools, categories, tags, curated collections, and media; the site reads **published** content from SQLite (or falls back to typed seed files in `data/`).

## Scripts

```bash
npm install
npm run dev       # http://localhost:3000 — site + /admin
npm run build
npm run start
npm run lint
npm run seed:catalog   # **required once**: copy static catalog into Payload (Categories, Tags, Tools)
```

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for SEO, sitemap, Open Graph (no trailing slash). |
| `NEXT_PUBLIC_SERVER_URL` | Same origin as the running app; used for Payload APIs and absolute media URLs. |
| `PAYLOAD_SECRET` | **Required in production.** Long random string for sessions and crypto. |
| `PREVIEW_SECRET` | Shared secret for draft preview (`/api/draft?secret=…`). |
| `DATABASE_URL` | Optional SQLite URL (default: `file:./data/payload.sqlite` under `site/`). |
| `USE_STATIC_CATALOG` | If `true`, public pages use only `data/*.ts` (no CMS reads). |
| `CMS_FALLBACK_STATIC` | If CMS has zero tools, fall back to static data (default on). Set `false` to show empty. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Used by `seed:catalog` when creating the first admin user. |

## CMS workflow

1. Copy `.env.example` → `.env` and set **`PAYLOAD_SECRET`** (and URLs). Then run **`npm run seed:catalog`** so Categories, Tags, and Tools match `data/*.ts` (the admin lists start empty until you seed).
2. Open **`/admin`** and sign in. If you did not seed first, create a user at `/admin`; the seed step also creates **`admin@example.com`** / **`changeme`** when that user does not exist (override with **`SEED_ADMIN_EMAIL`** / **`SEED_ADMIN_PASSWORD`** in `.env`).
3. Assign **Admin** or **Editor** under Users → role. Only **admins** can publish/unpublish catalog entries, categories, and collections; editors draft and mark **In review**.
4. **Live preview** in the admin uses Payload’s preview URL → `/api/draft` enables Next.js **Draft Mode** and redirects to the real tool, category, or collection page.
5. Catalog documents use **Draft → In review → Published → Archived**. **Hard delete is disabled** on catalog collections; archive instead.
6. **Duplicate document** is available in the Payload UI for tools (Payload default).
7. **Quality warnings** (duplicate names, thin sections) appear in the tool **Audit** tab; publishing still enforces required URLs, summary, “why included”, platforms, etc.

## Content sources

- **CMS (default):** SQLite at `data/payload.sqlite` (gitignored), uploads under `media/`.
- **Static fallback:** `data/categories.ts`, `data/tools.ts`, mapped via `lib/cms/map-static.ts`.
- **Migration:** `npm run seed:catalog` creates categories, tags, tools, and related-tool links from the static files (idempotent per slug).

## Architecture (high level)

- `payload.config.ts` — Payload app config, SQLite adapter, collections.
- `payload/collections/*` — Users (auth + roles), Media, catalog-categories, catalog-tags, catalog-tools, curated-collections.
- `app/(payload)/` — Payload admin UI and REST routes (generated import map).
- `lib/cms/queries.ts` — Public reads with `draftMode()` for preview; `overrideAccess` only inside trusted server code.
- `app/api/draft/route.ts` — Validates `PREVIEW_SECRET`, enables draft mode, redirects to the front door.

## Security notes

- Keep `PAYLOAD_SECRET` and `PREVIEW_SECRET` private; rotate if leaked.
- Admin and APIs require authentication; public routes never expose draft content unless Draft Mode is enabled via the preview secret.
- Media uploads are readable anonymously so logos/screenshots render on the public site; only staff can upload or replace files; only **admins** can delete media.
