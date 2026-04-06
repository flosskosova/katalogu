/**
 * Payload migrations without `npx payload` (avoids tsx/@next/env + `.ts` migration import issues).
 * From `site/`: `node --env-file=.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/payload-migrate.ts <cmd>`
 *
 * - `create <name>` — generate migration from current schema (migrate:create)
 * - `run` — apply pending migrations to DATABASE_URL (passes `migrations` from `migrations/index.ts`)
 * - `status` — compare repo migrations vs DB
 */
import process from "process";
import { getMigrations } from "payload";

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

  const { default: config } = await import("../payload.config.ts");

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

  const { getPayload } = await import("payload");
  const { migrations } = await import("../migrations/index.ts");
  const payload = await getPayload({ config });

  if (cmd === "run") {
    if (!migrations?.length) {
      console.error("No migrations exported from migrations/index.ts");
      await payload.destroy();
      process.exit(1);
    }
    console.log(`Applying ${migrations.length} migration(s) to DATABASE_URL…`);
    await payload.db.migrate.call(payload.db, { migrations });
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
  console.error(e);
  process.exit(1);
});
