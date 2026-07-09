#!/usr/bin/env bash
# Restore a Supabase/Vercel Postgres dump into the Docker Compose `db` service.
# Run from the repo root on the VPS (or locally to test migration).
#
# Usage:
#   ./scripts/vps-import-database.sh
#   ./scripts/vps-import-database.sh site/data/backups/prod-sync-2026-07-04.dump
#   IMPORT_DUMP=site/data/backups/prod-sync-latest.dump ./scripts/vps-import-database.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.docker.example to .env and set secrets first." >&2
  exit 1
fi

DUMP="${1:-${IMPORT_DUMP:-site/data/backups/prod-sync-latest.dump}}"
if [[ ! -f "$DUMP" ]]; then
  echo "Dump not found: $DUMP" >&2
  echo "On your laptop run: cd site && npm run export:production-db" >&2
  echo "Then copy site/data/backups/*.dump to the VPS (scp/rsync)." >&2
  exit 1
fi

export IMPORT_DUMP="/backups/$(basename "$DUMP")"

echo "Starting Postgres container..."
docker compose up -d db

echo "Waiting for Postgres health..."
for _ in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U "${POSTGRES_USER:-opencatalog}" -d "${POSTGRES_DB:-opencatalog}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Importing $DUMP (mounted as $IMPORT_DUMP)..."
docker compose --profile tools run --rm \
  -e "IMPORT_DUMP=$IMPORT_DUMP" \
  import-db

echo ""
echo "Import complete. Set PAYLOAD_POSTGRES_PUSH=false in .env, then:"
echo "  docker compose up -d --build"
