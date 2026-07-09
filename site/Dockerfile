# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY patches ./patches
COPY scripts/ensure-libsql-web-driver.mjs ./scripts/ensure-libsql-web-driver.mjs
RUN npm ci

FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SERVER_URL
ARG PAYLOAD_SERVER_URL
ARG NEXT_PUBLIC_CF_BEACON_TOKEN
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV PAYLOAD_SERVER_URL=${PAYLOAD_SERVER_URL}
ENV NEXT_PUBLIC_CF_BEACON_TOKEN=${NEXT_PUBLIC_CF_BEACON_TOKEN}
RUN npm run fetch-tool-logos \
  && test "$(find public/tool-logos -type f | wc -l)" -gt 500
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home nextjs \
  && mkdir -p media data \
  && chown -R nextjs:nodejs media data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN test -f ./public/tool-logos/debian.png \
  || (echo "ERROR: tool logos missing from production image" >&2 && exit 1)
COPY --from=builder /app/scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --from=builder /app/scripts/docker-wait-postgres.mjs /app/scripts/docker-wait-postgres.mjs

RUN chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]

# One-off admin tasks: seed catalog, reset password, etc.
FROM deps AS tools
WORKDIR /app
COPY . .
ENTRYPOINT ["npm", "run"]
