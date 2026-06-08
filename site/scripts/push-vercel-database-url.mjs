#!/usr/bin/env node
/**
 * Set Vercel `DATABASE_URL` via the REST API (works when the dashboard
 * clears long / special-character connection strings).
 *
 * Prerequisites:
 *   1. `cd site` then `npx vercel link` — creates `.vercel/project.json`.
 *   2. Create a token: https://vercel.com/account/tokens (Full account, or
 *      a token with permission to manage project environment variables).
 *   3. Set `VERCEL_TOKEN` in the shell (never commit it).
 *
 * Usage:
 *   $env:VERCEL_TOKEN="..."   # PowerShell
 *   node scripts/push-vercel-database-url.mjs --file dburl.secret.txt
 *
 * The file must contain exactly one line: the full postgres URL (no quotes).
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const API = "https://api.vercel.com";

function parseArgs(argv) {
  const out = { file: null, stdin: false, targets: ["production", "preview"] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" && argv[i + 1]) {
      out.file = argv[++i];
    } else if (a === "--stdin") {
      out.stdin = true;
    } else if (a === "--targets" && argv[i + 1]) {
      out.targets = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    }
  }
  return out;
}

async function readUrl({ file, stdin }) {
  if (stdin) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    return Buffer.concat(chunks).toString("utf8").trim();
  }
  if (!file) {
    console.error("Missing --file path or --stdin.");
    process.exit(1);
  }
  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  return fs.readFileSync(abs, "utf8").trim().replace(/\r\n/g, "\n").split("\n").join("").trim();
}

function loadProjectMeta() {
  const p = path.join(process.cwd(), ".vercel", "project.json");
  if (!fs.existsSync(p)) {
    console.error(
      `Missing ${p}. Run: cd site && npx vercel link`,
    );
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const projectId = j.projectId;
  const orgId = j.orgId;
  if (!projectId) {
    console.error(".vercel/project.json has no projectId.");
    process.exit(1);
  }
  return { projectId, orgId };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function listEnvVars(token, projectId, orgId) {
  const q = new URLSearchParams();
  if (orgId) q.set("teamId", orgId);
  const url = `${API}/v9/projects/${encodeURIComponent(projectId)}/env?${q}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  const text = await res.text();
  if (!res.ok) {
    console.error(`List env failed HTTP ${res.status}: ${text}`);
    process.exit(1);
  }
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data?.envs && Array.isArray(data.envs)) return data.envs;
  return [];
}

async function deleteEnvVar(token, projectId, orgId, id) {
  const q = new URLSearchParams();
  if (orgId) q.set("teamId", orgId);
  const url = `${API}/v9/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(id)}?${q}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    console.error(`Delete env ${id} failed HTTP ${res.status}: ${text}`);
    process.exit(1);
  }
}

async function createEnvVar(token, projectId, orgId, value, targets) {
  const q = new URLSearchParams();
  if (orgId) q.set("teamId", orgId);
  const url = `${API}/v10/projects/${encodeURIComponent(projectId)}/env?${q}`;
  const body = {
    key: "DATABASE_URL",
    value,
    type: "encrypted",
    target: targets,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Create DATABASE_URL failed HTTP ${res.status}: ${text}`);
    process.exit(1);
  }
  return JSON.parse(text);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`
Usage:
  VERCEL_TOKEN=... node scripts/push-vercel-database-url.mjs --file dburl.secret.txt
  VERCEL_TOKEN=... node scripts/push-vercel-database-url.mjs --stdin < dburl.secret.txt

Options:
  --targets production,preview   (default: both)
`);
    process.exit(0);
  }

  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) {
    console.error("Set VERCEL_TOKEN (https://vercel.com/account/tokens).");
    process.exit(1);
  }

  const url = await readUrl(args);
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    console.error("Value must start with postgres:// or postgresql://");
    process.exit(1);
  }

  const { projectId, orgId } = loadProjectMeta();
  console.error(`Project ${projectId}${orgId ? ` (team ${orgId})` : ""}`);

  const rows = await listEnvVars(token, projectId, orgId);
  const toRemove = rows.filter((e) => e && e.key === "DATABASE_URL");
  for (const e of toRemove) {
    console.error(`Removing existing DATABASE_URL (${e.id})…`);
    await deleteEnvVar(token, projectId, orgId, e.id);
  }

  console.error(`Creating DATABASE_URL for targets: ${args.targets.join(", ")}…`);
  await createEnvVar(token, projectId, orgId, url, args.targets);
  console.error("Done. In Vercel: open Deployments → Redeploy Production (or push to main).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
