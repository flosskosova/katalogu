/**
 * Emits data/tools-definitive-opensource.ts from
 * [definitive-opensource](https://github.com/mustbeperfect/definitive-opensource)
 * canonical JSON: core/data/dynamic/applications.json
 *
 * Skips entries whose GitHub repo URL (normalized) or slug already exists in any site/data/tools*.ts fragment.
 *
 * Run: node scripts/gen-definitive-opensource-tools.mjs
 * Optional: DEFINITIVE_JSON_PATH=/path/to/applications.json (offline)
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const JSON_URL =
  "https://raw.githubusercontent.com/mustbeperfect/definitive-opensource/main/core/data/dynamic/applications.json";

/** Definitive `category` slug -> catalog categorySlug */
const CATEGORY_MAP = {
  "ad-blocker": "security-privacy",
  agent: "ai-ml",
  "ai-image-gui": "ai-ml",
  "ai-utilities": "ai-ml",
  "all-in-one": "ai-ml",
  antivirus: "security-privacy",
  "api-client": "developer-tools",
  arr: "self-hosting",
  assistant: "ai-ml",
  "audio-editor": "audio-tools",
  "audio-player": "media-players",
  authentication: "security-privacy",
  automation: "automation",
  autonomy: "ai-ml",
  backup: "backup-recovery",
  "bookmark-manager": "notes-knowledge",
  browser: "web-browsers",
  "browser-extensions": "web-browsers",
  cad: "3d-cad",
  calendar: "scheduling-booking",
  canvas: "education",
  chat: "communication",
  cleaner: "system-utilities",
  "clipboard-manager": "system-utilities",
  "code-assistant": "ides-editors",
  "code-editor": "ides-editors",
  collaboration: "communication",
  "container-management": "containers-virtualization",
  containers: "containers-virtualization",
  context: "ai-ml",
  control: "developer-tools",
  dashboard: "self-hosting",
  "dev-tools": "developer-tools",
  diagrams: "graphics-design",
  "document-editor": "office-productivity",
  "document-management": "document-management",
  "document-modifier": "office-productivity",
  "dotfiles-manager": "system-utilities",
  "download-manager": "networking",
  engineering: "3d-cad",
  "file-manager": "system-utilities",
  "file-sharing": "file-sync-storage",
  finance: "finance-accounting",
  firewall: "security-privacy",
  firmware: "developer-tools",
  "game-engine": "gaming",
  "game-launcher": "gaming",
  games: "gaming",
  "git-client": "developer-tools",
  "git-hosting": "version-control-devops",
  graphics: "graphics-design",
  "home-automation": "self-hosting",
  "home-server": "self-hosting",
  ide: "ides-editors",
  "image-editing": "graphics-design",
  "image-processing": "graphics-design",
  "information-processing": "ai-ml",
  "keyboard-manager": "system-utilities",
  "knowledge-base": "notes-knowledge",
  "language-package-manager": "developer-tools",
  launcher: "system-utilities",
  linux: "operating-systems",
  "llm-gui": "ai-ml",
  macos: "system-utilities",
  mail: "email",
  manager: "ai-ml",
  "markdown-editor": "notes-knowledge",
  "media-downloader": "video-tools",
  "media-management": "self-hosting",
  "model-tools": "ai-ml",
  "neovim-extensions": "ides-editors",
  network: "networking",
  "note-taking": "notes-knowledge",
  "office-suite": "office-productivity",
  "operating-system": "operating-systems",
  other: "system-utilities",
  "package-manager": "system-utilities",
  "password-manager": "password-managers",
  "project-management": "project-management",
  prompt: "system-utilities",
  proofreading: "office-productivity",
  rag: "ai-ml",
  reading: "education",
  "remote-desktop": "networking",
  research: "ai-ml",
  robotics: "developer-tools",
  rocketry: "education",
  "screen-recording": "video-tools",
  "search-engine": "self-hosting",
  "server-management": "self-hosting",
  shell: "system-utilities",
  simulation: "education",
  "social-network": "federated-social",
  spreadsheet: "office-productivity",
  storage: "file-sync-storage",
  surveillance: "self-hosting",
  sync: "file-sync-storage",
  system: "system-utilities",
  "system-monitoring": "monitoring",
  "task-management": "project-management",
  "terminal-emulator": "system-utilities",
  "terminal-multiplexer": "system-utilities",
  "terminal-utilities": "system-utilities",
  "text-editor": "ides-editors",
  "time-management": "project-management",
  tools: "system-utilities",
  transcription: "audio-tools",
  uncategorized: "system-utilities",
  "version-manager": "developer-tools",
  "video-conference": "communication",
  "video-editing": "video-tools",
  "video-player": "media-players",
  "video-transcoder": "video-tools",
  "virtual-machine": "containers-virtualization",
  vpn: "networking",
  wiki: "notes-knowledge",
  "window-management": "system-utilities",
  windows: "system-utilities",
};

function normRepoUrl(u) {
  if (!u || typeof u !== "string") return "";
  let s = u.trim().toLowerCase().replace(/\.git$/, "").replace(/\/$/, "");
  const m = s.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) return s;
  return `https://github.com/${m[1]}/${m[2]}`;
}

/** Curated tools sometimes use org root (e.g. github.com/bitwarden); skip definitive child repos (…/server). */
function normSiteHost(u) {
  if (!u || typeof u !== "string") return "";
  try {
    const host = new URL(u.trim()).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "firefox.com") return "mozilla.org";
    if (host.endsWith(".videolan.org") || host === "videolan.org") return "videolan.org";
    return host;
  } catch {
    return "";
  }
}

function normProductName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/^mozilla\s+/, "")
    .replace(/\s+media player$/, "")
    .replace(/\s+/g, " ");
}

function repoConflictsWithExisting(repoUrl, existingRepos) {
  const n = normRepoUrl(repoUrl);
  if (!n || !n.includes("github.com")) return false;
  if (existingRepos.has(n)) return true;
  const m = n.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
  if (m) {
    const orgRoot = `https://github.com/${m[1]}`;
    if (existingRepos.has(orgRoot)) return true;
  }
  return false;
}

function repoSlugFromUrl(url) {
  const m = String(url).match(/github\.com\/[^/]+\/([^/?#]+)/i);
  if (!m) return "unknown";
  return m[1].replace(/\.git$/i, "").toLowerCase();
}

function loadExistingKeys() {
  const slugs = new Set();
  const repos = new Set();
  const hosts = new Set();
  const productNames = new Set();
  const files = readdirSync(DATA_DIR).filter((f) => f.startsWith("tools") && f.endsWith(".ts"));
  const slugRe = /slug:\s*"([^"]+)"/g;
  const repoRe = /sourceRepo:\s*"([^"]+)"/g;
  const siteRe = /officialSite:\s*"([^"]+)"/g;
  const nameRe = /name:\s*"([^"]+)"/g;
  for (const f of files) {
    const text = readFileSync(path.join(DATA_DIR, f), "utf8");
    let m;
    while ((m = slugRe.exec(text))) slugs.add(m[1]);
    while ((m = repoRe.exec(text))) {
      const n = normRepoUrl(m[1]);
      if (n) repos.add(n);
    }
    while ((m = siteRe.exec(text))) {
      const h = normSiteHost(m[1]);
      if (h && h !== "github.com") hosts.add(h);
    }
    while ((m = nameRe.exec(text))) {
      const pn = normProductName(m[1]);
      if (pn.length >= 3) productNames.add(pn);
    }
  }
  return { slugs, repos, hosts, productNames };
}

function mapPlatforms(platforms) {
  if (!platforms?.length) return ["Cross-platform"];
  const labels = {
    cross: "Cross-platform",
    macos: "macOS",
    windows: "Windows",
    linux: "Linux",
    android: "Android",
    ios: "iOS",
    mobile: "Mobile",
    selfhost: "Self-hosted",
    "web-cloud": "Web",
    vscode: "VS Code",
    jetbrains: "JetBrains IDEs",
    chromium: "Chromium",
    firefox: "Firefox",
    na: "Varies",
  };
  const out = [];
  for (const p of platforms) {
    const key = String(p).toLowerCase();
    if (labels[key]) out.push(labels[key]);
  }
  return out.length ? [...new Set(out)] : ["Cross-platform"];
}

function starsToMaturity(stars) {
  const n = Number(stars) || 0;
  if (n >= 50000) return "industry-standard";
  if (n >= 10000) return "established";
  if (n >= 2000) return "growing";
  return "experimental";
}

function starsToRank(stars) {
  const n = Number(stars) || 0;
  if (n >= 40000) return "also-strong";
  if (n >= 8000) return "honorable";
  return "honorable";
}

function toolBlock(o) {
  const plat = JSON.stringify(o.platforms);
  const strengths = JSON.stringify(o.strengths);
  const lim = JSON.stringify(o.limitations);
  const alts = JSON.stringify(o.alternatives);
  const tags = JSON.stringify(o.tags);
  const lines = [
    "  {",
    `    slug: ${JSON.stringify(o.slug)},`,
    `    name: ${JSON.stringify(o.name)},`,
    `    categorySlug: ${JSON.stringify(o.categorySlug)},`,
    `    summary: ${JSON.stringify(o.summary)},`,
    `    whyIncluded: ${JSON.stringify(o.whyIncluded)},`,
    `    bestFor: ${JSON.stringify(o.bestFor)},`,
    `    platforms: ${plat},`,
    `    license: ${JSON.stringify(o.license)},`,
    `    maintenanceStatus: ${JSON.stringify(o.maintenanceStatus)},`,
    `    maturity: ${JSON.stringify(o.maturity)},`,
    `    strengths: ${strengths},`,
    `    limitations: ${lim},`,
    `    alternatives: ${alts},`,
    `    officialSite: ${JSON.stringify(o.officialSite)},`,
    `    sourceRepo: ${JSON.stringify(o.sourceRepo)},`,
    `    tags: ${tags},`,
    `    rank: ${JSON.stringify(o.rank)},`,
  ];
  if (o.selfHosted) lines.push(`    selfHosted: true,`);
  if (o.developerFocused) lines.push(`    developerFocused: true,`);
  if (o.privacyFocused) lines.push(`    privacyFocused: true,`);
  lines.push("  },");
  return lines.join("\n");
}

async function loadApplications() {
  const local = process.env.DEFINITIVE_JSON_PATH;
  if (local) {
    const raw = readFileSync(local, "utf8");
    return JSON.parse(raw).applications;
  }
  const res = await fetch(JSON_URL);
  if (!res.ok) throw new Error(`Fetch ${JSON_URL}: ${res.status}`);
  const raw = await res.text();
  return JSON.parse(raw).applications;
}

/** Align with Payload `catalog-tools` slug validation (see lib/catalog-tool-slug.ts). */
const PAYLOAD_TOOL_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function toPayloadToolSlug(raw) {
  const s = String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (s && PAYLOAD_TOOL_SLUG_RE.test(s)) return s;
  return "app";
}

function uniqueSlug(base, taken) {
  let s = base;
  let i = 0;
  while (taken.has(s)) {
    i += 1;
    s = `${base}-${i}`;
  }
  taken.add(s);
  return s;
}

const apps = await loadApplications();
const { slugs: existingSlugs, repos: existingRepos, hosts: existingHosts, productNames: existingProductNames } =
  loadExistingKeys();
const newSlugTaken = new Set(existingSlugs);
const rows = [];

for (const a of apps) {
  const repoUrl = normRepoUrl(a.repo_url);
  if (!repoUrl || !repoUrl.includes("github.com")) continue;
  if (repoConflictsWithExisting(repoUrl, existingRepos)) continue;

  const name = String(a.name || "").trim();
  const productName = normProductName(name);
  if (productName.length >= 3 && existingProductNames.has(productName)) continue;

  const officialSite =
    a.homepage_url && String(a.homepage_url).trim().startsWith("http")
      ? String(a.homepage_url).trim()
      : a.repo_url;
  const siteHost = normSiteHost(officialSite);
  if (siteHost && siteHost !== "github.com" && existingHosts.has(siteHost)) continue;

  const repoDerived = repoSlugFromUrl(repoUrl).replace(/\./g, "-");
  let baseSlug = toPayloadToolSlug(repoDerived);
  if (!baseSlug || baseSlug === "unknown") continue;
  const slug = uniqueSlug(baseSlug, newSlugTaken);

  const categorySlug = CATEGORY_MAP[a.category] || "system-utilities";
  const displayName = name || baseSlug;
  const summary = String(a.description || "")
    .trim()
    .slice(0, 280);
  const license = a.license && a.license !== "NOASSERTION" ? String(a.license) : "See upstream repository";

  const tags = [
    "definitive-opensource",
    ...(a.tags || []).map((t) => String(t).toLowerCase().replace(/\s+/g, "-")),
  ];

  const selfHosted = (a.platforms || []).some((p) => String(p).toLowerCase() === "selfhost");
  const devCats = new Set([
    "code-assistant",
    "code-editor",
    "dev-tools",
    "git-client",
    "git-hosting",
    "ide",
    "language-package-manager",
    "neovim-extensions",
    "terminal-utilities",
    "version-manager",
    "api-client",
  ]);
  const developerFocused = devCats.has(a.category);

  rows.push({
    slug,
    name: displayName,
    categorySlug,
    summary: summary || `${displayName} — open-source project listed in definitive-opensource.`,
    whyIncluded: `Listed in [definitive-opensource](https://github.com/mustbeperfect/definitive-opensource) as a curated consumer-facing open-source application.`,
    bestFor: `Users exploring vetted FOSS alternatives in this space (${a.category?.replace(/-/g, " ") || "general"}).`,
    platforms: mapPlatforms(a.platforms),
    license,
    maintenanceStatus: "active",
    maturity: starsToMaturity(a.stars),
    strengths: [
      a.stars ? `~${Number(a.stars).toLocaleString("en-US")} GitHub stars (per upstream list)` : "Active upstream project",
      "Open source",
    ],
    limitations: ["Verify license, platform support, and security posture for your environment."],
    alternatives: [],
    officialSite,
    sourceRepo: a.repo_url,
    tags: [...new Set(tags)].filter(Boolean).slice(0, 12),
    rank: starsToRank(a.stars),
    selfHosted: selfHosted || undefined,
    developerFocused: developerFocused || undefined,
  });

  existingRepos.add(repoUrl);
  if (siteHost && siteHost !== "github.com") existingHosts.add(siteHost);
  if (productName.length >= 3) existingProductNames.add(productName);
}

const header = `import type { Tool } from "../lib/types";

/**
 * Entries sourced from [definitive-opensource](https://github.com/mustbeperfect/definitive-opensource)
 * (applications.json). Skips tools already present elsewhere in the seed data (by GitHub repo URL or slug).
 * Regenerate: \`node scripts/gen-definitive-opensource-tools.mjs\`
 */
export const definitiveOpenSourceTools: Tool[] = [
`;

const outPath = path.join(DATA_DIR, "tools-definitive-opensource.ts");
writeFileSync(outPath, header + rows.map(toolBlock).join("\n") + "\n];\n", "utf8");
console.log("Wrote", outPath, "new entries:", rows.length, "(from", apps.length, "source rows)");
