# Deploy to Ubuntu VPS (Docker)

Self-host the Next.js + Payload catalog with **Postgres**, persistent **media uploads**, and optional **Caddy** HTTPS.

This guide covers migrating from the current **Vercel + Supabase** setup (`https://catalog.flossk.org`) to a self-hosted VPS.

## Requirements

- Ubuntu 22.04+ VPS (2 GB RAM minimum recommended for build)
- Docker Engine + Docker Compose v2
- Domain pointing at the VPS (optional; can start with `http://YOUR_IP:3000`)

## Migrate from Vercel + Supabase (recommended)

Use this when you already run in production on Vercel and want the **same CMS data** on the VPS — not a fresh seed from static files.

### A. On your laptop (before touching the VPS)

1. **Keep production secrets** — your `site/.env.production.backup` should contain at least:
   - `DATABASE_URL` or `DATABASE_URL_PRODUCTION` (Supabase session pooler, port **5432**)
   - `PAYLOAD_SECRET`, `PREVIEW_SECRET` (copy the **same values** from Vercel → Settings → Environment Variables)
   - Turnstile production keys if you use the suggest form

2. **Export the live Supabase database:**

```bash
cd site
npm run export:production-db
```

This writes `site/data/backups/prod-sync-YYYY-MM-DD.dump` and links `prod-sync-latest.dump`.

Requires `pg_dump` (`brew install libpq` on macOS).

3. **Commit/push your code** (including Docker files) to git, or rsync the repo to the VPS.

4. **Copy the dump to the VPS:**

```bash
scp site/data/backups/prod-sync-latest.dump user@YOUR_VPS:/path/to/katalogizimi/site/data/backups/
```

### B. On the Ubuntu VPS

1. Install Docker (step 1 below).

2. Clone the repo and create `.env`:

```bash
git clone <your-repo-url> katalogizimi
cd katalogizimi
cp .env.docker.example .env
```

3. Edit `.env` — **copy production values from Vercel** where noted:

| Variable | Notes |
|----------|--------|
| `POSTGRES_PASSWORD` | New strong password for the **local** Docker Postgres container |
| `PAYLOAD_SECRET` | **Same as Vercel** — keeps admin sessions/crypto consistent |
| `PREVIEW_SECRET` | **Same as Vercel** |
| `NEXT_PUBLIC_SITE_URL` | Your VPS domain, e.g. `https://catalog.flossk.org` |
| `PAYLOAD_SERVER_URL` | Must match the browser origin exactly |
| `PAYLOAD_POSTGRES_PUSH` | **`false`** when importing a Supabase dump (schema already exists) |
| Turnstile keys | Copy `NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION` + `TURNSTILE_SECRET_KEY_PRODUCTION` from Vercel |

Do **not** set `BLOB_READ_WRITE_TOKEN` on the VPS — uploads use the `media_data` Docker volume instead of Vercel Blob.

4. **Import the Supabase dump** (one time):

```bash
chmod +x scripts/vps-import-database.sh
./scripts/vps-import-database.sh site/data/backups/prod-sync-latest.dump
```

Expected: `users` and `tools` counts match production (Supabase `vault` extension warnings are normal).

5. **Build and start the app:**

```bash
docker compose up -d --build
```

6. **HTTPS** — point DNS to the VPS, set `SITE_DOMAIN`, then:

```bash
docker compose --profile https up -d
```

7. **Cut over DNS** from Vercel to the VPS when ready. Keep Vercel/Supabase running until you verify `/admin`, browse, and suggest-tool.

8. **Weekly backups** — install the backup cron after the site is live:

```bash
chmod +x scripts/vps-backup.sh
mkdir -p /var/backups/katalogu
crontab -e
```

Add:

```cron
0 3 * * 0 cd /path/to/katalogizimi && BACKUP_DIR=/var/backups/katalogu BACKUP_RETENTION_DAYS=31 ./scripts/vps-backup.sh >> /var/log/katalogu-backup.log 2>&1
```

This creates:

- Postgres dumps in `/var/backups/katalogu/db`
- media archives in `/var/backups/katalogu/media`
- `.env` snapshots in `/var/backups/katalogu/env`

and automatically deletes files older than 31 days.

### Media (logos / screenshots)

Production on Vercel uses **Vercel Blob**; the Supabase dump has **0 local media rows** today — tool logos mostly come from static URLs and official sites. New uploads on the VPS land in the `media_data` volume at `/app/media`.

If you later add Blob-hosted media, download those files and place them under `media/` before or after cutover.

### Fresh install (no Supabase migration)

If you do **not** import a dump, set `PAYLOAD_POSTGRES_PUSH=true`, run `docker compose up -d --build`, then:

```bash
docker compose --profile tools run --rm seed
```

Set `PAYLOAD_POSTGRES_PUSH=false` afterward.

---

## 1. Install Docker on the VPS

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"
# log out and back in so `docker` works without sudo
```

## 2. Clone and configure

```bash
git clone <your-repo-url> katalogizimi
cd katalogizimi
cp .env.docker.example .env
```

## 3. First deploy

```bash
docker compose up -d --build
```

Wait until `docker compose ps` shows `app` and `db` healthy. Open:

- Site: `http://YOUR_VPS_IP:3000` (or your domain if already configured)
- Admin: `http://YOUR_VPS_IP:3000/admin`

### After schema is created

Set `PAYLOAD_POSTGRES_PUSH=false` in `.env`, then:

```bash
docker compose up -d
```

Leaving push enabled in production can run schema management on every cold start.

## 4. HTTPS with Caddy (recommended)

1. Point DNS `A` / `AAAA` for your domain to the VPS IP.
2. Set in `.env`:
   - `SITE_DOMAIN=catalog.flossk.org`
   - `NEXT_PUBLIC_SITE_URL=https://catalog.flossk.org`
   - `PAYLOAD_SERVER_URL=https://catalog.flossk.org`
3. Start with the `https` profile:

```bash
docker compose --profile https up -d
```

Caddy obtains and renews Let's Encrypt certificates automatically.

## 5. Updates

```bash
git pull
docker compose up -d --build
```

Media uploads and Postgres data live in Docker volumes (`media_data`, `postgres_data`) and survive rebuilds.

## 6. Automatic backups

Run the backup script manually:

```bash
chmod +x scripts/vps-backup.sh
BACKUP_DIR=/var/backups/katalogu BACKUP_RETENTION_DAYS=31 ./scripts/vps-backup.sh
```

Suggested weekly cron (Sundays at 03:00 UTC):

```cron
0 3 * * 0 cd /path/to/katalogizimi && BACKUP_DIR=/var/backups/katalogu BACKUP_RETENTION_DAYS=31 ./scripts/vps-backup.sh >> /var/log/katalogu-backup.log 2>&1
```

Restore flow:

1. Use the newest `postgres-*.dump` with `./scripts/vps-import-database.sh`.
2. Extract the matching `media-*.tgz` into the `media_data` volume or `/app/media`.
3. Restore the matching `.env` snapshot if needed.

## 7. Useful commands

```bash
docker compose logs -f app          # app logs
docker compose ps                   # service status
docker compose down                 # stop (keeps volumes)
docker compose down -v              # stop and delete volumes (data loss)
```

**Reset admin password** (with the stack running):

```bash
docker compose --profile tools run --rm tools admin:reset-password
```

**Re-export Supabase from laptop:**

```bash
cd site && npm run export:production-db
```

## Architecture

```text
Internet → [Caddy :443] → app:3000 (Next.js standalone)
                              ↓
                         db:5432 (Postgres)
                         media_data volume (/app/media)
```

Without the `https` profile, the app is exposed directly on `${APP_PORT:-3000}`.

## Differences from Vercel

| Vercel | Docker VPS |
|--------|------------|
| Supabase Postgres | Bundled Postgres container |
| Vercel Blob for media | Local volume at `/app/media` |
| `VERCEL=1` pool limits | Default Postgres pool max **10** (override with `PAYLOAD_POSTGRES_POOL_MAX`) |
| Env in Vercel dashboard | `.env` file on the server |

Do **not** set `BLOB_READ_WRITE_TOKEN` unless you intentionally want Vercel Blob instead of local disk storage.

## Troubleshooting

- **`/admin` login fails / 403** — `PAYLOAD_SERVER_URL` must exactly match the browser origin (http vs https, www vs apex).
- **Empty catalog after import** — re-run `./scripts/vps-import-database.sh` and check `docker compose logs db`.
- **Build OOM on small VPS** — build the image on your laptop (`docker compose build`), push to a registry, and pull on the VPS; or add swap.
- **Postgres connection errors** — check `docker compose logs db` and that `POSTGRES_PASSWORD` in `.env` has no unescaped `$` characters (or quote it in `.env`).

See also [`site/README.md`](./site/README.md) for CMS workflow and environment variable reference.
