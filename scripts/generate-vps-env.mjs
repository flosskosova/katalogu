#!/usr/bin/env node
/**
 * Build a Docker Compose `.env` for the VPS from Vercel production secrets.
 * Writes `../.env.vps` (repo root) — never commit that file.
 *
 * Usage (from repo root):
 *   node scripts/generate-vps-env.mjs
 *   node scripts/generate-vps-env.mjs --out .env
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const siteDir = path.join(root, "site");

function parseArgs(argv) {
  let out = path.join(root, ".env.vps");
  let envFile = path.join(siteDir, ".env.vercel.production");
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) out = path.resolve(argv[++i]);
    else if (argv[i] === "--env-file" && argv[i + 1])
      envFile = path.resolve(argv[++i]);
  }
  return { out, envFile };
}

function loadEnv(file) {
  const map = new Map();
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

const { out, envFile } = parseArgs(process.argv);
if (!fs.existsSync(envFile)) {
  console.error(`Missing ${envFile} — run: cd site && npx vercel env pull .env.vercel.production --environment=production`);
  process.exit(1);
}

const env = loadEnv(envFile);
const get = (key) => env.get(key) ?? "";

const payloadSecret = get("PAYLOAD_SECRET");
const previewSecret = get("PREVIEW_SECRET");
if (!payloadSecret) {
  console.error("PAYLOAD_SECRET missing in", envFile);
  process.exit(1);
}

const siteUrl = get("NEXT_PUBLIC_SITE_URL") || "https://catalog.flossk.org";
const domain = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

const lines = [
  "# Generated for VPS — copy to the server as .env (do not commit)",
  "POSTGRES_USER=opencatalog",
  `POSTGRES_PASSWORD=${crypto.randomBytes(24).toString("base64url")}`,
  "POSTGRES_DB=opencatalog",
  `PAYLOAD_SECRET=${payloadSecret}`,
  `PREVIEW_SECRET=${previewSecret}`,
  `NEXT_PUBLIC_SITE_URL=${siteUrl}`,
  `NEXT_PUBLIC_SERVER_URL=${siteUrl}`,
  `PAYLOAD_SERVER_URL=${siteUrl}`,
  "PAYLOAD_POSTGRES_PUSH=false",
  "APP_PORT=3000",
  `SITE_DOMAIN=${domain}`,
];

const turnstileSite =
  get("NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION") ||
  get("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
const turnstileSecret =
  get("TURNSTILE_SECRET_KEY_PRODUCTION") || get("TURNSTILE_SECRET_KEY");
if (turnstileSite) lines.push(`NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION=${turnstileSite}`);
if (turnstileSecret) lines.push(`TURNSTILE_SECRET_KEY_PRODUCTION=${turnstileSecret}`);

fs.writeFileSync(out, `${lines.join("\n")}\n`, { mode: 0o600 });
console.log(`Wrote ${out}`);
console.log("Next: scp .env.vps user@VPS:/path/to/katalogizimi/.env");
