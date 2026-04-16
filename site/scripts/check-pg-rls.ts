import pg from "pg";

type Row = {
  table: string;
  rls: boolean;
  anon_grants: number;
  auth_grants: number;
};

function clean(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.trim().replace(/\r?\n/g, "");
  return s || undefined;
}

async function audit(client: pg.Client): Promise<Row[]> {
  const { rows } = await client.query<Row>(`
    SELECT
      c.relname AS "table",
      c.relrowsecurity AS rls,
      COALESCE(SUM(CASE WHEN g.grantee = 'anon' THEN 1 ELSE 0 END), 0)::int AS anon_grants,
      COALESCE(SUM(CASE WHEN g.grantee = 'authenticated' THEN 1 ELSE 0 END), 0)::int AS auth_grants
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN information_schema.role_table_grants g
      ON g.table_schema = n.nspname
     AND g.table_name = c.relname
     AND g.grantee IN ('anon', 'authenticated')
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    GROUP BY c.relname, c.relrowsecurity
    ORDER BY c.relname
  `);
  return rows;
}

function isPayloadCompatible(row: Row): boolean {
  return !row.rls && row.anon_grants === 0 && row.auth_grants === 0;
}

async function main() {
  const fix = process.argv.includes("--fix");
  const url = clean(process.env.DATABASE_URL);
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    console.log("DATABASE_URL is not postgres; nothing to check.");
    return;
  }

  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    const roleExists = async (role: "anon" | "authenticated") => {
      const { rowCount } = await c.query(
        "SELECT 1 FROM pg_roles WHERE rolname = $1 LIMIT 1",
        [role],
      );
      return (rowCount ?? 0) > 0;
    };
    const hasAnon = await roleExists("anon");
    const hasAuthenticated = await roleExists("authenticated");

    const before = await audit(c);
    const bad = before.filter((r) => !isPayloadCompatible(r));
    if (!fix) {
      if (bad.length === 0) {
        console.log(
          "All public tables are Payload-safe (RLS off, no anon/authenticated grants).",
        );
        return;
      }
      console.log("Public tables needing Payload-safe hardening:");
      for (const r of bad) {
        console.log(
          `  public.${r.table} (rls=${r.rls}, anon=${r.anon_grants}, authenticated=${r.auth_grants})`,
        );
      }
      console.log(
        "Run with --fix to disable RLS and revoke anon/authenticated grants.",
      );
      process.exitCode = 1;
      return;
    }

    await c.query("BEGIN");
    for (const r of before) {
      const safeTable = r.table.replace(/"/g, "\"\"");
      await c.query(`ALTER TABLE public."${safeTable}" DISABLE ROW LEVEL SECURITY;`);
      if (hasAnon) {
        await c.query(`REVOKE ALL ON TABLE public."${safeTable}" FROM anon;`);
      }
      if (hasAuthenticated) {
        await c.query(`REVOKE ALL ON TABLE public."${safeTable}" FROM authenticated;`);
      }
    }
    await c.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;");
    await c.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;");
    await c.query("COMMIT");
    console.log(`Applied Payload-safe hardening to ${before.length} public table(s).`);
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    await c.end();
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
