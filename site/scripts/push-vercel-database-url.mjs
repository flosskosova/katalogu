#!/usr/bin/env node
/**
 * Set Vercel `DATABASE_URL` via the REST API (works when the dashboard
 * clears long / special-character connection strings). Uses upsert so existing
 * env metadata (build/runtime scoping) is not wiped by delete+recreate.
 *
 * Prerequisites:
 *   1. Link the project **either** by:
 *      - `cd site` then `npx vercel link` (creates `.vercel/project.json`), **or**
 *      - set `VERCEL_PROJECT_ID` (and `VERCEL_ORG_ID` for a team) — ids are under
 *        Vercel → Project → Settings → General.
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
  const fromEnvProject = process.env.VERCEL_PROJECT_ID?.trim();
  const fromEnvOrg = process.env.VERCEL_ORG_ID?.trim();
  if (fromEnvProject) {
    return { projectId: fromEnvProject, orgId: fromEnvOrg || undefined };
  }

  const p = path.join(process.cwd(), ".vercel", "project.json");
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p} and VERCEL_PROJECT_ID is unset.

Fix one of:
  A) From folder site/: run  npx vercel link
     (log in if asked; pick team + existing project — creates .vercel/project.json)

  B) Non-interactive:  npx vercel link --yes --project YOUR_PROJECT_NAME --team YOUR_TEAM_SLUG

  C) Set env then re-run (ids: Vercel → Project → Settings → General):
     PowerShell:
       $env:VERCEL_PROJECT_ID="prj_..."
       $env:VERCEL_ORG_ID="team_..."   # omit on personal (Hobby) account
`);
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

async function upsertEnvVar(token, projectId, orgId, value, targets) {
  const q = new URLSearchParams();
  if (orgId) q.set("teamId", orgId);
  q.set("upsert", "true");
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
    console.error(`Upsert DATABASE_URL failed HTTP ${res.status}: ${text}`);
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

  console.error(`Upserting DATABASE_URL for targets: ${args.targets.join(", ")}…`);
  await upsertEnvVar(token, projectId, orgId, url, args.targets);
  console.error("Done. In Vercel: open Deployments → Redeploy Production (or push to main).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
