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
| `TURSO_DATABASE_URL` / `DATABASE_URL` | SQLite URL: local `file:…` (default) or remote **`libsql://…`** ([Turso](https://turso.tech)). **`TURSO_*` names match Turso’s Vercel docs**; `DATABASE_*` works too. **Required for Payload on Vercel.** |
| `TURSO_AUTH_TOKEN` / `DATABASE_AUTH_TOKEN` | Turso/libSQL auth token. Omit for local `file:` databases. Prefer **`TURSO_AUTH_TOKEN`** on Vercel if you use the Turso integration. |
| `USE_STATIC_CATALOG` | If `true`, public pages use only `data/*.ts` (no CMS reads). |
| `CMS_FALLBACK_STATIC` | If CMS has zero tools, fall back to static data (default on). Set `false` to show empty. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Used by `seed:catalog` when creating the first admin user. |

### Vercel / serverless

Payload **cannot** use a on-disk `file:…` SQLite path on Vercel (ephemeral filesystem). Create a **Turso** database and set **`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`** (or the `DATABASE_*` pair) for **Production**, without extra quotes around values—HTTP **401** from Turso almost always means a missing/wrong token or a var not enabled for that environment. Redeploy after changing env. Apply the schema once (e.g. `npm run payload:migrate` locally, or [Payload + Turso on Vercel](https://payloadcms.com/posts/guides/how-to-set-up-payload-with-sqlite-and-turso-for-deployment-on-vercel)). Alternatively, set **`USE_STATIC_CATALOG=true`** for a **public catalog only** (no durable CMS), but `/admin` still expects a working DB.

#### Vercel checklist (Supabase Postgres + `next build`)

These steps are done in the **Vercel dashboard** (not in git):

1. **Production branch** — **Settings → Environments**: Production should track **`main`** (or whichever branch you intend). After merging features into `main`, wait for the **Production** deployment to finish **Ready**.
2. **`DATABASE_URL` at build time** — **Settings → Environment Variables** → edit **`DATABASE_URL`**. It must apply to **Production** (and **Preview** if you want Preview builds). If the UI offers **Build** vs **Runtime** (or “available during build”), enable **Build** for Production: `next build` runs Payload and needs `DATABASE_URL`, or the build fails with `[payload] DATABASE_URL is unset on Vercel production`.
3. **Session pooler** — Use Supabase **Connect → Session pooler**, host `*.pooler.supabase.com`, port **5432**; URL-encode special characters in the DB password. See `site/.env.example` (Postgres section).
4. **Secrets** — Resolve **Needs Attention** on **`PAYLOAD_SECRET`**, **`PREVIEW_SECRET`**, etc. Redeploy after any change.
5. **Dashboard won’t save `DATABASE_URL`** — put the URI in a one-line file `site/dburl.secret.txt` (gitignored), then from `site/`: create a [Vercel token](https://vercel.com/account/tokens), run `npx vercel link` once, then  
   `$env:VERCEL_TOKEN="…"; npm run vercel:push-database-url -- --file dburl.secret.txt`  
   This uses the REST API via `scripts/push-vercel-database-url.mjs`. Delete the file after. Redeploy Production.
6. **Test DB from your PC (no `psql`)** — `npm run test:pg -- --url-file dburl.secret.txt` or after `vercel env pull .env.check`: `npm run test:pg -- --env-file .env.check`. On success it prints host + timing only; on failure you see the real driver error (fix URI/Supabase before chasing Vercel).

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
- Supabase/Postgres with Payload: do not rely on RLS for Payload-managed `public` tables. Revoke `anon` / `authenticated` table grants and keep RLS disabled on those tables, or use a DB role with `BYPASSRLS`. Use `npm run check:pg-rls` to audit, `npm run check:pg-rls:fix` to apply the safe defaults directly, or `npm run check:pg-rls:sql` to print the equivalent SQL for Supabase SQL Editor from `scripts/sql/payload-postgres-hardening.sql`.
- Supabase/Postgres on **Vercel**: use the **Session pooler** URI (host `*.pooler.supabase.com`, port **5432**). Avoid **Transaction** pooler (port **6543**) for Payload/Drizzle prepared statements. Direct `db.*.supabase.co` often fails from serverless (IPv4/DNS). Keep `PAYLOAD_POSTGRES_PUSH=false` for normal runtime traffic; only enable it temporarily for an intentional one-time schema push.
