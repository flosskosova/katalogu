/**
 * Reports near-duplicate tools (same official site host or normalized product name).
 * Run from site/: npx tsx scripts/report-tool-semantic-duplicates.ts
 */
import { tools } from "../data/tools";

function normSite(u: unknown): string {
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

function normProductName(n: unknown): string {
  return String(n ?? "")
    .trim()
    .toLowerCase()
    .replace(/^mozilla\s+/, "")
    .replace(/\s+media player$/, "")
    .replace(/\s+/g, " ");
}

type Dup = {
  kind: "site" | "name";
  key: string;
  firstSlug: string;
  secondSlug: string;
  firstName: string;
  secondName: string;
};

const bySite = new Map<string, number>();
const byName = new Map<string, number>();
const dups: Dup[] = [];

tools.forEach((t, i) => {
  const site = normSite(t.officialSite);
  if (site) {
    if (bySite.has(site)) {
      const fi = bySite.get(site)!;
      dups.push({
        kind: "site",
        key: site,
        firstSlug: tools[fi].slug,
        secondSlug: t.slug,
        firstName: tools[fi].name,
        secondName: t.name,
      });
    } else {
      bySite.set(site, i);
    }
  }

  const name = normProductName(t.name);
  if (name.length >= 3) {
    if (byName.has(name)) {
      const fi = byName.get(name)!;
      dups.push({
        kind: "name",
        key: name,
        firstSlug: tools[fi].slug,
        secondSlug: t.slug,
        firstName: tools[fi].name,
        secondName: t.name,
      });
    } else {
      byName.set(name, i);
    }
  }
});

console.log("Total tools:", tools.length);
console.log("Semantic duplicates:", dups.length);
for (const d of dups) {
  console.log(
    `[${d.kind}] ${d.key}: ${d.firstSlug} (${d.firstName}) <-> ${d.secondSlug} (${d.secondName})`,
  );
}
