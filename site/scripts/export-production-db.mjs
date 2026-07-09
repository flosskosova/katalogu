#!/usr/bin/env node
/**
 * Export the live Supabase/Vercel Postgres database to a local dump file
 * for VPS migration (docker compose import-db).
 *
 * Prerequisites: pg_dump on PATH (brew install libpq)
 *
 * Usage (from `site/`):
 *   npm run export:production-db
 *   npm run export:production-db -- --env-file .env.production.backup
 *   npm run export:production-db -- --out ../site/data/backups/my.dump
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  let envFile = ".env.production.backup";
  let out = null;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--env-file" && argv[i + 1]) envFile = argv[++i];
    else if (a === "--out" && argv[i + 1]) out = argv[++i];
    else if (a === "--help" || a === "-h") return { help: true };
  }
  return { envFile, out };
}

function loadEnvFile(abs) {
  const raw = fs.readFileSync(abs, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

function resolveDatabaseUrl() {
  const url =
    process.env.DATABASE_URL_PRODUCTION?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "";
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    console.error(
      "Missing postgres DATABASE_URL. Set DATABASE_URL_PRODUCTION in the env file (export from Vercel/Supabase).",
    );
    process.exit(1);
  }
  return url;
}

function main() {
  const { help, envFile, out } = parseArgs(process.argv);
  if (help) {
    console.log(`Usage: node scripts/export-production-db.mjs [--env-file .env.production.backup] [--out path.dump]`);
    process.exit(0);
  }

  const envAbs = path.isAbsolute(envFile) ? envFile : path.join(process.cwd(), envFile);
  if (!fs.existsSync(envAbs)) {
    console.error(`Env file not found: ${envAbs}`);
    console.error("Create it from Vercel → Settings → Environment Variables (DATABASE_URL, PAYLOAD_SECRET, …).");
    process.exit(1);
  }

  loadEnvFile(envAbs);
  const url = resolveDatabaseUrl();

  const backupsDir = path.join(process.cwd(), "data", "backups");
  fs.mkdirSync(backupsDir, { recursive: true });

  const dated = `prod-sync-${new Date().toISOString().slice(0, 10)}.dump`;
  const dumpPath = out
    ? path.isAbsolute(out)
      ? out
      : path.join(process.cwd(), out)
    : path.join(backupsDir, dated);
  const latestLink = path.join(backupsDir, "prod-sync-latest.dump");

  console.error(`Exporting production Postgres → ${dumpPath}`);

  const r = spawnSync(
    "pg_dump",
    ["--no-owner", "--no-acl", "-Fc", "-f", dumpPath, url],
    {
      stdio: "inherit",
      env: { ...process.env, PGSSLMODE: "require" },
    },
  );

  if (r.status !== 0) {
    console.error("pg_dump failed. Install libpq: brew install libpq");
    process.exit(r.status || 1);
  }

  const sizeMb = Math.round((fs.statSync(dumpPath).size / 1024 / 1024) * 10) / 10;
  console.error(`OK: ${dumpPath} (${sizeMb} MB)`);

  try {
    if (fs.existsSync(latestLink)) fs.unlinkSync(latestLink);
    fs.symlinkSync(path.basename(dumpPath), latestLink);
    console.error(`Linked: ${latestLink} → ${path.basename(dumpPath)}`);
  } catch {
    fs.copyFileSync(dumpPath, latestLink);
    console.error(`Copied latest: ${latestLink}`);
  }
}

main();
