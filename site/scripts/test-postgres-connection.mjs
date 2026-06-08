#!/usr/bin/env node
/**
 * Test Postgres connectivity with `pg` (same family Payload uses).
 * Does not print passwords or full URLs — only hostname on success.
 *
 * Usage (pick one):
 *   node scripts/test-postgres-connection.mjs --url-file dburl.secret.txt
 *   node scripts/test-postgres-connection.mjs --env-file .env.check
 *   DATABASE_URL=... node scripts/test-postgres-connection.mjs
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

function parseArgs(argv) {
  let urlFile = null;
  let envFile = null;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url-file" && argv[i + 1]) urlFile = argv[++i];
    else if (a === "--env-file" && argv[i + 1]) envFile = argv[++i];
  }
  return { urlFile, envFile };
}

function loadEnvFile(abs) {
  const raw = fs.readFileSync(abs, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
    if (!m) continue;
    const k = m[1];
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

function loadUrlFromFile(abs) {
  const raw = fs.readFileSync(abs, "utf8").trim();
  const line = raw.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) return t.slice("DATABASE_URL=".length).trim();
  return t;
}

function hostnameOnly(connectionString) {
  try {
    const u = connectionString.replace(/^postgres(ql)?:/i, "https:");
    return new URL(u).hostname;
  } catch {
    return "(could not parse host)";
  }
}

function sslForUrl(connectionString) {
  const h = hostnameOnly(connectionString).toLowerCase();
  if (h.includes("supabase") || h.includes("pooler.supabase.com")) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

async function main() {
  const { urlFile, envFile } = parseArgs(process.argv);
  if (envFile) {
    const abs = path.isAbsolute(envFile) ? envFile : path.join(process.cwd(), envFile);
    loadEnvFile(abs);
  }
  let connectionString = process.env.DATABASE_URL?.trim();
  if (urlFile) {
    const abs = path.isAbsolute(urlFile) ? urlFile : path.join(process.cwd(), urlFile);
    connectionString = loadUrlFromFile(abs);
  }
  if (!connectionString || !/^postgres(ql)?:\/\//i.test(connectionString)) {
    console.error(
      "Missing DATABASE_URL. Use --url-file, --env-file, or set DATABASE_URL.",
    );
    process.exit(1);
  }

  const host = hostnameOnly(connectionString);
  const t0 = Date.now();
  const client = new Client({
    connectionString,
    ssl: sslForUrl(connectionString),
    connectionTimeoutMillis: 25_000,
  });

  try {
    await client.connect();
    const { rows } = await client.query("select 1 as ok, (select count(*)::int from users) as users");
    const ms = Date.now() - t0;
    console.error(`OK: connected to ${host} in ${ms}ms`);
    console.error(`OK: query result`, rows[0]);
    await client.end();
    process.exit(0);
  } catch (e) {
    const ms = Date.now() - t0;
    console.error(`FAIL after ${ms}ms (host ${host}):`, e?.message || e);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

main();
