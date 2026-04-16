/**
 * Reports duplicate tools in the merged `tools` export (slug, GitHub repo, name).
 * Run from site/: npx tsx scripts/report-tool-duplicates.ts
 */
import { tools } from "../data/tools";

function normGithubRepo(u: unknown): string {
  if (!u || typeof u !== "string") return "";
  const s = u.trim().toLowerCase().replace(/\.git$/i, "").replace(/\/$/, "");
  const m = s.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!m) return "";
  return `${m[1]}/${m[2]}`;
}

function normName(n: unknown): string {
  return String(n ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

type DupSlug = { slug: string; firstIdx: number; secondIdx: number };
type DupRepo = {
  repo: string;
  firstSlug: string;
  secondSlug: string;
  firstIdx: number;
  secondIdx: number;
};
type DupName = {
  name: string;
  firstSlug: string;
  secondSlug: string;
  firstIdx: number;
  secondIdx: number;
};

const slugDups: DupSlug[] = [];
const repoDups: DupRepo[] = [];
const nameDups: DupName[] = [];

const bySlug = new Map<string, number>();
const byRepo = new Map<string, number>();
const byName = new Map<string, number>();

tools.forEach((t, i) => {
  const slug = t.slug;
  if (bySlug.has(slug)) {
    slugDups.push({
      slug,
      firstIdx: bySlug.get(slug)!,
      secondIdx: i,
    });
  } else {
    bySlug.set(slug, i);
  }

  const r = normGithubRepo(t.sourceRepo);
  if (r) {
    if (byRepo.has(r)) {
      const fi = byRepo.get(r)!;
      repoDups.push({
        repo: r,
        firstSlug: tools[fi].slug,
        secondSlug: slug,
        firstIdx: fi,
        secondIdx: i,
      });
    } else {
      byRepo.set(r, i);
    }
  }

  const n = normName(t.name);
  if (n.length < 2) return;
  if (byName.has(n)) {
    const fi = byName.get(n)!;
    nameDups.push({
      name: n,
      firstSlug: tools[fi].slug,
      secondSlug: slug,
      firstIdx: fi,
      secondIdx: i,
    });
  } else {
    byName.set(n, i);
  }
});

console.log("Total tools:", tools.length);
console.log("\nDuplicate slugs:", slugDups.length);
for (const d of slugDups) console.log(JSON.stringify(d));

console.log("\nDuplicate GitHub repos (owner/repo):", repoDups.length);
for (const d of repoDups) console.log(JSON.stringify(d));

console.log("\nDuplicate names (case-insensitive):", nameDups.length);
for (const d of nameDups.slice(0, 200)) console.log(JSON.stringify(d));
if (nameDups.length > 200) console.log("... truncated", nameDups.length - 200, "more");
