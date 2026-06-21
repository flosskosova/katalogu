#!/usr/bin/env node
/**
 * Apply a .sql file to Postgres (DATABASE_URL). For one-off schema patches on Supabase production.
 *
 * Usage (from site/):
 *   node scripts/apply-postgres-sql-file.mjs scripts/sql/add-tool-suggestions-catalog-tool-id.sql
 *   node scripts/apply-postgres-sql-file.mjs --url-file dburl.secret.txt scripts/sql/add-tool-suggestions-catalog-tool-id.sql
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

function parseArgs(argv) {
  let urlFile = null;
  const files = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url-file" && argv[i + 1]) urlFile = argv[++i];
    else files.push(a);
  }
  return { urlFile, file: files[0] ?? null };
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
  const { urlFile, file } = parseArgs(process.argv);
  if (!file) {
    console.error("Usage: node scripts/apply-postgres-sql-file.mjs [--url-file path] <file.sql>");
    process.exit(1);
  }

  let connectionString = process.env.DATABASE_URL?.trim();
  if (urlFile) {
    const abs = path.isAbsolute(urlFile) ? urlFile : path.join(process.cwd(), urlFile);
    connectionString = loadUrlFromFile(abs);
  }
  if (!connectionString || !/^postgres(ql)?:\/\//i.test(connectionString)) {
    console.error("Missing postgres DATABASE_URL. Use --url-file or set DATABASE_URL.");
    process.exit(1);
  }

  const sqlPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  const sql = fs.readFileSync(sqlPath, "utf8");
  const host = hostnameOnly(connectionString);
  const client = new Client({
    connectionString,
    ssl: sslForUrl(connectionString),
    connectionTimeoutMillis: 25_000,
  });

  try {
    await client.connect();
    console.error(`Applying ${path.basename(sqlPath)} to ${host}…`);
    await client.query(sql);
    console.error("OK: SQL applied.");
    await client.end();
  } catch (e) {
    console.error("FAIL:", e instanceof Error ? e.message : e);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

main();
