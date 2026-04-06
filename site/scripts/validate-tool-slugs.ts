/**
 * Ensures every static catalog slug matches Payload `catalog-tools` beforeChange rules.
 * Run from site/: `node ./node_modules/jiti/lib/jiti-cli.mjs scripts/validate-tool-slugs.ts`
 */
import { tools } from "../data/tools";
import { isCatalogToolSlugValid } from "../lib/catalog-tool-slug";

const invalid: { slug: string; name: string; issue: string }[] = [];
const seen = new Map<string, number>();

for (const t of tools) {
  if (!isCatalogToolSlugValid(t.slug)) {
    invalid.push({
      slug: t.slug,
      name: t.name,
      issue: "invalid-char-or-shape",
    });
  }
  seen.set(t.slug, (seen.get(t.slug) ?? 0) + 1);
}

const duplicates = [...seen.entries()]
  .filter(([, n]) => n > 1)
  .map(([slug]) => slug);

if (invalid.length || duplicates.length) {
  if (invalid.length) {
    console.error(
      "Invalid slugs (lowercase a-z, 0-9, hyphen-separated segments only):",
    );
    for (const row of invalid) console.error(" ", row);
  }
  if (duplicates.length) {
    console.error("Duplicate slugs:", duplicates.join(", "));
  }
  process.exit(1);
}

console.log(`OK: ${tools.length} tools, all slugs valid and unique.`);
