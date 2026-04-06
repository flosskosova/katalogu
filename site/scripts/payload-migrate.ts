/**
 * Payload migrations without `npx payload` (avoids tsx/@next/env + `.ts` migration import issues).
 * From `site/`: `node --env-file=.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/payload-migrate.ts <cmd>`
 *
 * - `create <name>` — generate migration from current schema (migrate:create)
 * - `run` — apply pending migrations to DATABASE_URL (passes `migrations` from `migrations/index.ts`)
 * - `status` — compare repo migrations vs DB
 *
 * Uses `jiti` with `@/*` → project root so `payload.config.ts` resolves like Next.js.
 */
import path from "node:path";
import process from "process";
import { createJiti } from "jiti";
import { getMigrations, getPayload } from "payload";

type PayloadConfig = Parameters<typeof getPayload>[0]["config"];

/** Matches `payload`’s `Migration` shape for `db.migrate` (repo migrations use typed `MigrateUpArgs`). */
type PayloadMigration = {
  up: (args: unknown) => Promise<void>;
  down: (args: unknown) => Promise<void>;
  name: string;
};

function createSiteJiti() {
  return createJiti(import.meta.url, {
    alias: { "@": process.cwd() },
  });
}

async function loadPayloadConfig(): Promise<PayloadConfig> {
  const mod = (await createSiteJiti().import(
    path.resolve(process.cwd(), "payload.config.ts"),
  )) as unknown as { default: PayloadConfig };
  return mod.default;
}

function isLibsqlUnauthorized(e: unknown): boolean {
  const parts: string[] = [];
  let cur: unknown = e;
  let depth = 0;
  while (cur && depth < 8) {
    if (cur instanceof Error) {
      parts.push(cur.message);
      cur = cur.cause;
    } else {
      parts.push(String(cur));
      break;
    }
    depth++;
  }
  const s = parts.join(" ");
  return /\b401\b/.test(s) || s.includes("Unauthorized");
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "help" || cmd === "-h") {
    console.log(`Usage (from site/):
  node --env-file=.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/payload-migrate.ts create [name]
  node --env-file=.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/payload-migrate.ts run
  node --env-file=.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/payload-migrate.ts status`);
    process.exit(cmd === "help" || cmd === "-h" ? 0 : 1);
  }

  process.env.PAYLOAD_MIGRATING = "true";
  process.env.DISABLE_PAYLOAD_HMR = "true";

  const config = await loadPayloadConfig();

  if (cmd === "create") {
    const { migrate: migrateBin } = await import(
      "../node_modules/payload/dist/bin/migrate.js",
    );
    const name = rest[0] ?? "initial";
    await migrateBin({
      config,
      parsedArgs: { _: ["migrate:create", name], help: false },
    });
    return;
  }

  const { migrations } = await import("../migrations/index");
  const payload = await getPayload({ config });

  if (cmd === "run") {
    if (!migrations?.length) {
      console.error("No migrations exported from migrations/index.ts");
      await payload.destroy();
      process.exit(1);
    }
    console.log(`Applying ${migrations.length} migration(s) to DATABASE_URL…`);
    await payload.db.migrate.call(payload.db, {
      migrations: migrations as PayloadMigration[],
    });
    console.log("Migrations finished.");
    await payload.destroy();
    return;
  }

  if (cmd === "status") {
    try {
      const { existingMigrations } = await getMigrations({ payload });
      for (const m of migrations) {
        const ran = existingMigrations.find((e) => e.name === m.name);
        console.log(
          `${m.name}: ${ran ? `applied (batch ${ran.batch})` : "not applied"}`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isLibsqlUnauthorized(e)) {
        console.error(
          "Turso / libSQL: HTTP 401 — DATABASE_AUTH_TOKEN (or TURSO_AUTH_TOKEN) is missing, invalid, or expired. Create a new token in the Turso dashboard and update .env (and Vercel).",
        );
        await payload.destroy();
        process.exit(1);
      }
      if (msg.includes("no such table")) {
        console.log(
          "No migration metadata table yet — run: npm run payload:migrate",
        );
      } else {
        throw e;
      }
    }
    await payload.destroy();
    return;
  }

  console.error("Unknown command:", cmd);
  await payload.destroy();
  process.exit(1);
}

main().catch((e: unknown) => {
  if (isLibsqlUnauthorized(e)) {
    console.error(
      "\nTurso / libSQL: HTTP 401 — DATABASE_AUTH_TOKEN (or TURSO_AUTH_TOKEN) is missing, invalid, or expired.\nCreate a new token in the Turso dashboard and update .env (and Vercel environment variables).\n",
    );
  } else {
    console.error(e);
  }
  process.exit(1);
});
