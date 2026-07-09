#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] && printf '%s' "$DATABASE_URL" | grep -q '^postgres'; then
  echo "[docker] Waiting for Postgres..."
  until node /app/scripts/docker-wait-postgres.mjs; do
    sleep 2
  done
fi

echo "[docker] Starting Next.js..."
if [ ! -f /app/public/tool-logos/debian.png ]; then
  echo "[docker] WARNING: /app/public/tool-logos is missing — rebuild app image after git pull" >&2
fi
exec "$@"
