/**
 * Download small logos for catalog tools into public/tool-logos/ and write data/tool-logos.json.
 * Local preview only — run: npm run fetch-tool-logos
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tools } from "../data/tools";
import {
  curatedLogoSources,
  faviconDomainForTool,
} from "../lib/catalog/tool-logo-overrides";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "tool-logos");
const MANIFEST_PATH = path.join(ROOT, "data", "tool-logos.json");

const CONCURRENCY = 12;
const MIN_BYTES = 120;

function githubOwner(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== "github.com") return null;
    const parts = pathname.split("/").filter(Boolean);
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

function siteHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function logoSources(tool: {
  slug: string;
  officialSite: string;
  sourceRepo: string;
}): string[] {
  const curated = curatedLogoSources(tool.slug);
  if (curated.length > 0) return [...new Set(curated)];

  const sources: string[] = [];
  const repo = tool.sourceRepo?.trim();
  const site = tool.officialSite?.trim();
  const faviconDomain = faviconDomainForTool(tool);

  if (faviconDomain && faviconDomain !== "github.com") {
    sources.push(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(faviconDomain)}&sz=128`,
    );
    sources.push(`https://icons.duckduckgo.com/ip3/${faviconDomain}.ico`);
  }

  const hasProductSite = !!site && siteHostname(site) !== "github.com";

  // GitHub org/user avatars are often personal photos — skip when a product site exists.
  if (!hasProductSite && repo) {
    const owner = githubOwner(repo);
    if (owner) {
      sources.push(`https://github.com/${owner}.png?size=128`);
    }
  }

  const host = site ? siteHostname(site) : repo ? siteHostname(repo) : null;
  if (host && host !== "github.com" && host !== faviconDomain) {
    sources.push(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
    );
    sources.push(`https://icons.duckduckgo.com/ip3/${host}.ico`);
  }

  if (host === "github.com" && repo) {
    const owner = githubOwner(repo);
    if (owner) {
      sources.push(`https://github.com/${owner}.png?size=128`);
    }
  }

  return [...new Set(sources)];
}

async function fetchLogo(
  sources: string[],
): Promise<{ bytes: Buffer; ext: string } | null> {
  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "OpenCatalog-LogoFetcher/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) continue;
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length < MIN_BYTES) continue;
      const ext =
        type.includes("png")
          ? "png"
          : type.includes("webp")
            ? "webp"
            : type.includes("svg")
              ? "svg"
              : type.includes("jpeg") || type.includes("jpg")
                ? "jpg"
                : "png";
      return { bytes, ext };
    } catch {
      // try next source
    }
  }
  return null;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const manifest: Record<string, string> = {};
  let ok = 0;
  let miss = 0;

  await mapPool(tools, CONCURRENCY, async (tool, index) => {
    const sources = logoSources(tool);
    const result = await fetchLogo(sources);
    if (result) {
      const filename = `${tool.slug}.${result.ext}`;
      const publicPath = `/tool-logos/${filename}`;
      await writeFile(path.join(OUT_DIR, filename), result.bytes);
      manifest[tool.slug] = publicPath;
      ok++;
    } else {
      miss++;
    }
    if ((index + 1) % 50 === 0 || index + 1 === tools.length) {
      process.stdout.write(
        `\r  ${index + 1}/${tools.length} processed (${ok} logos, ${miss} missing)`,
      );
    }
  });

  process.stdout.write("\n");
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(sorted, null, 2)}\n`,
  );
  console.log(`Wrote ${ok} logos to public/tool-logos/`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  if (miss > 0) {
    console.log(`${miss} tools had no usable logo (placeholder will show).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
