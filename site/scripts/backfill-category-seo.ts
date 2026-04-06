/**
 * Writes SEO fields for every catalog-categories row in Payload.
 *
 * Usage (from `site/`):
 *   npm run backfill:seo:categories           — only rows missing title, description, or canonical
 *   npm run backfill:seo:categories -- --all  — overwrite SEO for all categories (keeps custom ogImage if set)
 */
import { getPayload } from "payload";
import { default as config } from "../payload.config";
import { computeCategorySeoPatchFromPayloadDoc } from "../payload/seo-defaults";

const allMode = process.argv.includes("--all");

function relationIdPresent(v: unknown): boolean {
  if (v == null || v === "") return false;
  if (typeof v === "number") return true;
  if (typeof v === "string") return v.length > 0;
  if (typeof v === "object" && v !== null && "id" in v)
    return (v as { id?: unknown }).id != null;
  return true;
}

async function main() {
  const payload = await getPayload({ config });
  let page = 1;
  let total = 0;
  let updated = 0;

  for (;;) {
    const res = await payload.find({
      collection: "catalog-categories",
      limit: 100,
      page,
      depth: 1,
      overrideAccess: true,
    });

    for (const doc of res.docs) {
      total += 1;
      const d = doc as Record<string, unknown>;
      const hasTitle = String(d.seoTitle ?? "").trim().length > 0;
      const hasDesc = String(d.seoDescription ?? "").trim().length > 0;
      const hasCanon = String(d.canonicalSlug ?? "").trim().length > 0;
      const full = computeCategorySeoPatchFromPayloadDoc(d);

      const patch: Record<string, unknown> = {};
      if (allMode || !hasTitle) patch.seoTitle = full.seoTitle;
      if (allMode || !hasDesc) patch.seoDescription = full.seoDescription;
      if (allMode || !hasCanon) patch.canonicalSlug = full.canonicalSlug;
      if (
        full.ogImage != null &&
        !relationIdPresent(d.ogImage) &&
        relationIdPresent(d.icon)
      ) {
        patch.ogImage = full.ogImage;
      }

      if (Object.keys(patch).length === 0) continue;

      await payload.update({
        collection: "catalog-categories",
        id: doc.id,
        data: patch,
        overrideAccess: true,
      });
      updated += 1;
      console.log("Category SEO:", String(d.slug ?? doc.id));
    }

    if (!res.hasNextPage) break;
    page += 1;
  }

  console.log(`Done. Scanned ${total}, updated ${updated}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
