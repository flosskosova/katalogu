/**
 * Blocks container start until Postgres accepts connections.
 * Used by scripts/docker-entrypoint.sh (self-hosted Docker).
 */
import pg from "pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!/^postgres(ql)?:\/\//i.test(url)) {
  process.exit(0);
}

const client = new pg.Client({
  connectionString: url,
  connectionTimeoutMillis: 5_000,
});

try {
  await client.connect();
  await client.query("SELECT 1");
  console.log("[docker] Postgres is ready");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`[docker] Postgres not ready yet: ${msg}`);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
