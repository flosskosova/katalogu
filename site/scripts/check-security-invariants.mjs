/**
 * Fails if a later edit removes a control from the catalog security fixes.
 * Repo checks only. Live checks: node site/scripts/check-security-invariants.mjs --live
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");
const failures = [];

function read(rel) {
  return readFileSync(path.join(rel.startsWith("site/") ? repoRoot : siteRoot, rel.startsWith("site/") ? rel.slice(5) : rel), "utf8");
}

function readRepo(rel) {
  return readFileSync(path.join(repoRoot, rel), "utf8");
}

function need(label, ok) {
  if (!ok) failures.push(label);
}

function versionOf(lock, pkgPath) {
  const block = lock.split(`"${pkgPath}": {`)[1];
  if (!block) return null;
  const match = block.match(/"version": "([^"]+)"/);
  return match?.[1] ?? null;
}

function atLeast(version, minimum) {
  const parse = (v) => v.split(".").map((n) => Number.parseInt(n, 10));
  const [a, b, c] = parse(version);
  const [x, y, z] = parse(minimum);
  if (a !== x) return a > x;
  if (b !== y) return b > y;
  return c >= z;
}

const secret = read("payload.config.ts");
need(
  "production must refuse a missing, placeholder, or short PAYLOAD_SECRET",
  secret.includes("PAYLOAD_SECRET must be a random string of at least 32 characters.") &&
    secret.includes('secret === "CHANGE_ME_DEV_ONLY"') &&
    secret.includes("secret.length < 32"),
);

const jsonLd = read("components/catalog/JsonLd.tsx");
need("JSON-LD must escape < before it is placed in a script tag", jsonLd.includes('.replace(/</g, "\\\\u003c")'));

const csp = read("next.config.mjs");
need(
  "public script-src must stay limited to self, inline, and the Cloudflare hosts",
  csp.includes(
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  ) && !csp.includes("unsafe-eval"),
);

const turnstile = read("lib/suggest-tool/turnstile-disabled.ts");
need("suggest-form Turnstile must stay enabled", /SUGGEST_TURNSTILE_DISABLED = false/.test(turnstile));

const clientIp = read("lib/suggest-tool/client-ip.ts");
need(
  "rate limiting must use only X-Real-IP",
  clientIp.includes('headers.get("x-real-ip")') &&
    !clientIp.includes("x-forwarded-for") &&
    !clientIp.includes("cf-connecting-ip"),
);

const accept = read("payload/tool-suggestions/createCatalogToolFromSuggestion.ts");
need(
  "only an admin may publish a suggestion on accept",
  accept.includes("options.fromSuggestionAccept === true && (await isStaffAdmin(req))"),
);

const caddy = readRepo("deploy/Caddyfile");
need(
  "Caddy must drop client forwarding headers and set X-Real-IP from Cloudflare",
  caddy.includes("header_up -X-Forwarded-For") &&
    caddy.includes("header_up -CF-Connecting-IP") &&
    caddy.includes("header_up X-Real-IP {http.request.header.CF-Connecting-IP}"),
);

const compose = readRepo("docker-compose.yml");
const appBlock = compose.split("\n  app:\n")[1]?.split("\n  caddy:\n")[0] ?? "";
need("the app container must not publish a host port", !/^\s+ports:/m.test(appBlock));
need("Compose must refuse to start without PAYLOAD_SECRET", compose.includes("PAYLOAD_SECRET: ${PAYLOAD_SECRET:?"));

const migration = read("migrations/postgres-prod.ts");
need(
  "the Payload 3.90 users column migration must stay in the production migration list",
  migration.includes("20260924_users_reset_password_requested_at"),
);

need(
  "Docker image builds must skip the secret check",
  secret.includes('process.env.NEXT_PHASE === "phase-production-build"') &&
    secret.includes('process.env["PAYLOAD_SECRET"]'),
);
need("the public GraphQL API must stay disabled", secret.includes("disable: true"));
need(
  "production must not push database schema on startup",
  secret.includes('return process.env.NODE_ENV !== "production"') &&
    compose.includes("PAYLOAD_POSTGRES_PUSH: ${PAYLOAD_POSTGRES_PUSH:-false}"),
);

const suggest = read("app/api/suggest-tool/route.ts");
need(
  "suggest submissions must be rejected when the production secret is weak",
  suggest.includes("Refusing submission: PAYLOAD_SECRET missing or too short in production."),
);
need(
  "suggest submissions must verify a Turnstile token",
  suggest.includes("verifyTurnstileToken(") && suggest.includes("Verification required. Please complete the CAPTCHA."),
);
need(
  "suggest submissions must reject a foreign Origin",
  suggest.includes("function assertSuggestToolOrigin") && suggest.includes('jsonError("Forbidden", 403)'),
);

const limits = read("lib/suggest-tool/rate-limit.ts");
need(
  "suggest rate limits must stay at 5 per IP and 3 per email each day",
  limits.includes("const MAX_PER_IP_24H = 5") && limits.includes("const MAX_PER_EMAIL_24H = 3"),
);

const turnstileKey = read("lib/suggest-tool/turnstile-public.ts");
need(
  "the Turnstile site key must be read at runtime",
  turnstileKey.includes("process.env[name]") &&
    turnstileKey.includes("TURNSTILE_TEST_SITE_KEY = \"1x00000000000000000000AA\"") &&
    /if \(process\.env\.NODE_ENV === "production"\) \{\s*return production \|\| general \|\| ""/.test(turnstileKey),
);

need(
  "an editor accept must not keep the publish flag",
  accept.includes("delete ctx[ACCEPT_SUGGESTION_CONTEXT]"),
);

const gitignore = readRepo(".gitignore");
const siteGitignore = read(".gitignore");
need(
  "secret env files must stay gitignored",
  gitignore.includes(".env*") &&
    gitignore.includes(".env.vps") &&
    siteGitignore.includes(".env*") &&
    !gitignore.includes("!.env\n") &&
    !siteGitignore.includes("!.env\n"),
);

const dbBlock = compose.split("\n  db:\n")[1]?.split("\n  app:\n")[0] ?? "";
const caddyBlock = compose.split("\n  caddy:\n")[1] ?? "";
need("Postgres must not publish a host port", !/^\s+ports:/m.test(dbBlock));
need(
  "only Caddy may publish ports 80 and 443",
  caddyBlock.includes('"80:80"') && caddyBlock.includes('"443:443"'),
);

const dockerfile = read("Dockerfile");
const nextConfig = csp;
need("the production image must be a Next standalone build", nextConfig.includes('output: "standalone"'));
need("the image build must not receive PAYLOAD_SECRET", !dockerfile.includes("PAYLOAD_SECRET"));

const lock = read("package-lock.json");
const nextVersion = versionOf(lock, "node_modules/next");
const nodemailerVersion = versionOf(lock, "node_modules/nodemailer");
const sharpVersion = versionOf(lock, "node_modules/sharp");
const payloadPackages = [
  "node_modules/payload",
  "node_modules/@payloadcms/db-postgres",
  "node_modules/@payloadcms/db-sqlite",
  "node_modules/@payloadcms/next",
  "node_modules/@payloadcms/richtext-lexical",
  "node_modules/@payloadcms/storage-vercel-blob",
  "node_modules/@payloadcms/ui",
].map((name) => versionOf(lock, name));

need(`Next.js must stay on 16.3.3 or newer (locked ${nextVersion})`, nextVersion && atLeast(nextVersion, "16.3.3"));
need(
  `nodemailer must stay on 9.1.1 or newer (locked ${nodemailerVersion})`,
  nodemailerVersion && atLeast(nodemailerVersion, "9.1.1"),
);
need(`sharp must stay on 0.35.4 or newer (locked ${sharpVersion})`, sharpVersion && atLeast(sharpVersion, "0.35.4"));
need(
  `all Payload packages must stay on the same 3.90.2 or newer release (locked ${payloadPackages.join(", ")})`,
  payloadPackages.every((version) => version && atLeast(version, "3.90.2")) &&
    new Set(payloadPackages).size === 1,
);

if (process.argv.includes("--live")) {
  const origin = process.env.SITE_URL?.replace(/\/$/, "") || "https://catalog.flossk.org";
  const home = await fetch(origin, { redirect: "manual" });
  const cspHeader = home.headers.get("content-security-policy") || "";
  need(`live home must answer (${origin} returned ${home.status})`, home.status === 200);
  need("live script-src must not allow unsafe-eval", !cspHeader.includes("unsafe-eval"));
  need(
    "live script-src must not allow every https origin",
    !/script-src[^;]*\shttps:(?:\s|;|$)/.test(cspHeader),
  );

  const login = await fetch(`${origin}/admin/login`);
  const loginHtml = await login.text();
  need(
    "live admin login must render",
    login.status === 200 &&
      !loginHtml.includes("could not render") &&
      !loginHtml.includes('E{"digest"'),
  );

  const suggestPage = await fetch(`${origin}/suggest`);
  const suggestHtml = await suggestPage.text();
  need(
    "live suggest page must load Turnstile",
    suggestPage.status === 200 && suggestHtml.includes("cf-turnstile"),
  );
}

if (failures.length) {
  console.error("Security checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  process.argv.includes("--live")
    ? "Security checks passed, including the live site."
    : "Security checks passed.",
);
