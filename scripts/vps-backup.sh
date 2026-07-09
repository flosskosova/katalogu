#!/usr/bin/env bash
# Backup the Dockerized VPS deployment: Postgres dump, uploaded media, and `.env`.
# Intended to run on the Ubuntu VPS via cron/systemd.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env in $ROOT" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/katalogu}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-31}"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

DB_DIR="$BACKUP_DIR/db"
MEDIA_DIR="$BACKUP_DIR/media"
ENV_DIR="$BACKUP_DIR/env"

mkdir -p "$DB_DIR" "$MEDIA_DIR" "$ENV_DIR"
chmod 700 "$BACKUP_DIR" "$DB_DIR" "$MEDIA_DIR" "$ENV_DIR"

echo "[backup] Starting Docker services needed for backup..."
docker compose up -d db app >/dev/null

echo "[backup] Waiting for Postgres health..."
for _ in $(seq 1 60); do
  if docker compose exec -T db pg_isready -U "${POSTGRES_USER:-opencatalog}" -d "${POSTGRES_DB:-opencatalog}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

DB_FILE="$DB_DIR/postgres-$STAMP.dump"
MEDIA_FILE="$MEDIA_DIR/media-$STAMP.tgz"
ENV_FILE="$ENV_DIR/env-$STAMP"

echo "[backup] Writing database dump to $DB_FILE"
docker compose exec -T db sh -lc 'pg_dump -U "${POSTGRES_USER:-opencatalog}" -d "${POSTGRES_DB:-opencatalog}" -Fc' >"$DB_FILE"

echo "[backup] Writing media archive to $MEDIA_FILE"
docker compose exec -T app sh -lc 'tar -czf - -C /app/media .' >"$MEDIA_FILE"

echo "[backup] Copying .env to $ENV_FILE"
cp .env "$ENV_FILE"
chmod 600 "$ENV_FILE" "$DB_FILE" "$MEDIA_FILE"

echo "[backup] Pruning backups older than $RETENTION_DAYS days"
find "$DB_DIR" -type f -name 'postgres-*.dump' -mtime +"$RETENTION_DAYS" -delete
find "$MEDIA_DIR" -type f -name 'media-*.tgz' -mtime +"$RETENTION_DAYS" -delete
find "$ENV_DIR" -type f -name 'env-*' -mtime +"$RETENTION_DAYS" -delete

echo "[backup] Done."
