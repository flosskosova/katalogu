/**
 * Lists Postgres tables with Row Level Security enabled (common Supabase issue).
 * Payload permission checks read `users` from the DB; RLS can hide rows even when using
 * `overrideAccess: true` in app code.
 *
 * Run: npm run check:pg-rls
 */
import pg from "pg";

function sanitizeEnvValue(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const s = v.trim().replace(/\r\n/g, "").replace(/\n/g, "");
  return s || undefined;
}

async function main() {
  const url = sanitizeEnvValue(process.env.DATABASE_URL);
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    console.log("DATABASE_URL is not a postgres URL — nothing to check.");
    process.exit(0);
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    const { rows } = await client.query<{
      schema: string;
      table: string;
      rls: boolean;
    }>(`
      SELECT n.nspname AS schema, c.relname AS "table", c.relrowsecurity AS rls
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname IN ('public', 'payload')
        AND c.relkind = 'r'
        AND c.relrowsecurity = true
      ORDER BY n.nspname, c.relname
    `);

    if (rows.length === 0) {
      console.log(
        "No tables in schemas public/payload have RLS enabled. (Supabase auth.* / storage.* RLS is normal and unrelated to Payload.)",
      );
      return;
    }

    console.log(
      "Payload-relevant tables with RLS enabled (admin permission checks read these; disable RLS or allow your DB role):\n",
    );
    for (const r of rows) {
      console.log(`  ${r.schema}.${r.table}`);
    }
    console.log(
      "\nExample fix (per table, adjust schema/name): ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;",
    );
  } finally {
    await client.end();
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
