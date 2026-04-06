/**
 * Replace generic "Listed in [some-github-list]…" whyIncluded text with
 * descriptions from each tool's officialSite (og:description / meta description),
 * falling back to the existing summary when fetch or parse fails.
 *
 * Run from site/: `npm run backfill:why-included`
 * Uses scripts/.why-included-cache.json — re-run skips cached slugs unless you pass --refetch.
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Tool } from "../lib/types";
import { definitiveOpenSourceTools } from "../data/tools-definitive-opensource";
import { awesomeOpenSourceSystemsTools } from "../data/tools-awesome-oss-systems";
import { topGithubReposListTools } from "../data/tools-top-github-repos-list";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CACHE_PATH = path.join(__dirname, ".why-included-cache.json");

type CacheEntry = {
  text: string;
  source: "og" | "meta" | "fallback-summary";
  fetchedAt: string;
};
type SlugCache = Record<string, CacheEntry>;

function loadCache(): SlugCache {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8")) as SlugCache;
  } catch {
    return {};
  }
}

function saveCache(c: SlugCache) {
  writeFileSync(CACHE_PATH, JSON.stringify(c, null, 2), "utf8");
}

function needsBackfill(why: string): boolean {
  return (
    why.includes("Listed in [") && why.includes("](https://github.com/")
  );
}

function decodeBasicEntities(s: string): string {
  let t = s
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCharCode(Number.parseInt(n, 10)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCharCode(Number.parseInt(h, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
  t = t.replace(/\r\n|\r|\n/g, " ").replace(/\s+/g, " ").trim();
  return t;
}

function extractMetaDescription(html: string): string | null {
  const patterns: RegExp[] = [
    /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i,
    /<meta\s+content=["']([^"']*)["']\s+property=["']og:description["']/i,
    /<meta\s+name=["']twitter:description["']\s+content=["']([^"']*)["']/i,
    /<meta\s+content=["']([^"']*)["']\s+name=["']twitter:description["']/i,
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i,
    /<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const t = decodeBasicEntities(m[1])
        .trim()
        .replace(/\s+/g, " ");
      if (t.length < 12) continue;
      const lower = t.toLowerCase();
      if (
        lower.includes("sign in to github") ||
        lower === "github" ||
        lower.startsWith("just a moment")
      ) {
        continue;
      }
      return t.slice(0, 900);
    }
  }
  return null;
}

function normalizeUrl(raw: string): string | null {
  const u = raw.trim();
  if (!u) return null;
  try {
    const href = u.startsWith("http://") || u.startsWith("https://") ? u : `https://${u}`;
    const parsed = new URL(href);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

async function resolveWhyIncluded(
  t: Tool,
  cache: SlugCache,
  refetch: boolean,
): Promise<string> {
  const cached = cache[t.slug];
  if (cached && !refetch) {
    return cached.text;
  }

  const url = normalizeUrl(t.officialSite);
  const fallback = t.summary.trim() || t.name.trim();

  if (!url) {
    cache[t.slug] = {
      text: fallback,
      source: "fallback-summary",
      fetchedAt: new Date().toISOString(),
    };
    return fallback;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 18_000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KatalogCatalogBot/1.0; +https://github.com/) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = (await res.text()).slice(0, 1_200_000);
    const desc = extractMetaDescription(html);
    if (desc) {
      cache[t.slug] = {
        text: desc,
        source: "og",
        fetchedAt: new Date().toISOString(),
      };
      return desc;
    }
  } catch {
    /* use fallback */
  }

  cache[t.slug] = {
    text: fallback,
    source: "fallback-summary",
    fetchedAt: new Date().toISOString(),
  };
  return fallback;
}

function emitTool(t: Tool): string {
  const j = JSON.stringify;
  const lines: string[] = ["  {"];
  lines.push(`    slug: ${j(t.slug)},`);
  lines.push(`    name: ${j(t.name)},`);
  lines.push(`    categorySlug: ${j(t.categorySlug)},`);
  lines.push(`    summary: ${j(t.summary)},`);
  lines.push(`    whyIncluded: ${j(t.whyIncluded)},`);
  lines.push(`    bestFor: ${j(t.bestFor)},`);
  lines.push(`    platforms: ${j(t.platforms)},`);
  lines.push(`    license: ${j(t.license)},`);
  lines.push(`    maintenanceStatus: ${j(t.maintenanceStatus)},`);
  lines.push(`    maturity: ${j(t.maturity)},`);
  lines.push(`    strengths: ${j(t.strengths)},`);
  lines.push(`    limitations: ${j(t.limitations)},`);
  lines.push(`    alternatives: ${j(t.alternatives)},`);
  if (t.replacesProprietary?.trim()) {
    lines.push(`    replacesProprietary: ${j(t.replacesProprietary.trim())},`);
  }
  lines.push(`    officialSite: ${j(t.officialSite)},`);
  lines.push(`    sourceRepo: ${j(t.sourceRepo)},`);
  if (t.docsUrl?.trim()) lines.push(`    docsUrl: ${j(t.docsUrl.trim())},`);
  if (t.longDescription?.trim()) {
    lines.push(`    longDescription: ${j(t.longDescription)},`);
  }
  if (t.targetUsers?.trim()) {
    lines.push(`    targetUsers: ${j(t.targetUsers)},`);
  }
  if (t.logoUrl?.trim()) lines.push(`    logoUrl: ${j(t.logoUrl)},`);
  if (t.galleryUrls?.length) lines.push(`    galleryUrls: ${j(t.galleryUrls)},`);
  if (t.seoTitle?.trim()) lines.push(`    seoTitle: ${j(t.seoTitle)},`);
  if (t.seoDescription?.trim()) {
    lines.push(`    seoDescription: ${j(t.seoDescription)},`);
  }
  if (t.canonicalSlug?.trim()) {
    lines.push(`    canonicalSlug: ${j(t.canonicalSlug)},`);
  }
  if (t.ogImageUrl?.trim()) lines.push(`    ogImageUrl: ${j(t.ogImageUrl)},`);
  lines.push(`    tags: ${j(t.tags)},`);
  lines.push(`    rank: ${j(t.rank)},`);
  if (t.homepageTopPick === true) lines.push(`    homepageTopPick: true,`);
  if (typeof t.editorialWeight === "number") {
    lines.push(`    editorialWeight: ${t.editorialWeight},`);
  }
  if (t.privacyFocused === true) lines.push(`    privacyFocused: true,`);
  if (t.selfHosted === true) lines.push(`    selfHosted: true,`);
  if (t.beginnerFriendly === true) lines.push(`    beginnerFriendly: true,`);
  if (t.developerFocused === true) lines.push(`    developerFocused: true,`);
  if (t.endUserFocused === true) lines.push(`    endUserFocused: true,`);
  if (t.relatedSlugs?.length) lines.push(`    relatedSlugs: ${j(t.relatedSlugs)},`);
  if (t.visibleOnWebsite === false) lines.push(`    visibleOnWebsite: false,`);
  lines.push("  },");
  return lines.join("\n");
}

function writeToolsFile(
  filePath: string,
  exportName: string,
  tools: Tool[],
  extraHeaderLine?: string,
) {
  const fullPath = path.join(ROOT, filePath);
  const prev = readFileSync(fullPath, "utf8");
  const exportIdx = prev.indexOf("export const ");
  if (exportIdx === -1) throw new Error(`No export in ${filePath}`);
  let header = prev.slice(0, exportIdx).trimEnd();
  if (extraHeaderLine && !header.includes(extraHeaderLine)) {
    const closeIdx = header.lastIndexOf("*/");
    if (closeIdx !== -1) {
      header =
        header.slice(0, closeIdx).trimEnd() +
        `\n * ${extraHeaderLine}\n ` +
        header.slice(closeIdx);
    } else {
      header += `\n * ${extraHeaderLine}`;
    }
  }
  header += "\n\n";
  const body = tools.map(emitTool).join("\n");
  const out = `${header}export const ${exportName}: Tool[] = [\n${body}\n];\n`;
  writeFileSync(fullPath, out, "utf8");
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, i: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

async function main() {
  const refetch = process.argv.includes("--refetch");
  const cache = loadCache();

  const jobs: { tool: Tool; file: string; exportName: string }[] = [];

  for (const tool of definitiveOpenSourceTools) {
    if (needsBackfill(tool.whyIncluded)) {
      jobs.push({
        tool,
        file: "data/tools-definitive-opensource.ts",
        exportName: "definitiveOpenSourceTools",
      });
    }
  }
  for (const tool of awesomeOpenSourceSystemsTools) {
    if (needsBackfill(tool.whyIncluded)) {
      jobs.push({
        tool,
        file: "data/tools-awesome-oss-systems.ts",
        exportName: "awesomeOpenSourceSystemsTools",
      });
    }
  }
  for (const tool of topGithubReposListTools) {
    if (needsBackfill(tool.whyIncluded)) {
      jobs.push({
        tool,
        file: "data/tools-top-github-repos-list.ts",
        exportName: "topGithubReposListTools",
      });
    }
  }

  console.log(`Tools needing whyIncluded backfill: ${jobs.length}`);

  let completed = 0;
  await runPool(jobs, 10, async (job) => {
    const text = await resolveWhyIncluded(job.tool, cache, refetch);
    job.tool.whyIncluded = text;
    completed++;
    if (completed % 25 === 0) {
      saveCache(cache);
      console.log(`  … ${completed}/${jobs.length}`);
    }
  });

  saveCache(cache);

  const byFile = new Map<string, { exportName: string; list: Tool[] }>();
  byFile.set("data/tools-definitive-opensource.ts", {
    exportName: "definitiveOpenSourceTools",
    list: definitiveOpenSourceTools,
  });
  byFile.set("data/tools-awesome-oss-systems.ts", {
    exportName: "awesomeOpenSourceSystemsTools",
    list: awesomeOpenSourceSystemsTools,
  });
  byFile.set("data/tools-top-github-repos-list.ts", {
    exportName: "topGithubReposListTools",
    list: topGithubReposListTools,
  });

  const note =
    "`whyIncluded` backfilled from official-site meta where possible (see scripts/backfill-why-included-official-sites.ts).";

  for (const [fp, { exportName, list }] of byFile) {
    writeToolsFile(fp, exportName, list, note);
  }

  const fromOg = Object.values(cache).filter((e) => e.source === "og").length;
  const fromFb = Object.values(cache).filter(
    (e) => e.source === "fallback-summary",
  ).length;
  console.log(
    `Done. Cache: ${Object.keys(cache).length} slugs (og/meta: ${fromOg}, summary fallback: ${fromFb}).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
