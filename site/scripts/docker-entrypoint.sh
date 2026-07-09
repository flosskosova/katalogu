#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] && printf '%s' "$DATABASE_URL" | grep -q '^postgres'; then
  echo "[docker] Waiting for Postgres..."
  until node /app/scripts/docker-wait-postgres.mjs; do
    sleep 2
  done
fi

echo "[docker] Starting Next.js..."
exec "$@"
