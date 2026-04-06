/**
 * Ensures every static seed tool exists in Payload `catalog-tools`.
 * Use in CI or after editing `data/tools*.ts` so admin search matches the public catalog merge.
 *
 * Skips when USE_STATIC_CATALOG=true (no CMS catalog expected).
 *
 * Run from `site/`: npm run verify:catalog-sync
 */
import { getPayload } from "payload";
import { default as config } from "../payload.config";
import { tools as staticTools } from "../data/tools";

async function allToolSlugsFromCms(): Promise<Set<string>> {
  const payload = await getPayload({ config });
  const slugs = new Set<string>();
  let page = 1;
  for (;;) {
    const res = await payload.find({
      collection: "catalog-tools",
      limit: 200,
      page,
      depth: 0,
      overrideAccess: true,
    });
    for (const doc of res.docs) {
      const s = String((doc as { slug?: string }).slug ?? "").trim();
      if (s) slugs.add(s);
    }
    if (!res.hasNextPage) break;
    page += 1;
  }
  return slugs;
}

function staticSlugIssues(): { duplicates: string[]; slugs: Set<string> } {
  const slugs = new Set<string>();
  const dupCounts = new Map<string, number>();
  for (const t of staticTools) {
    dupCounts.set(t.slug, (dupCounts.get(t.slug) ?? 0) + 1);
    slugs.add(t.slug);
  }
  const duplicates = [...dupCounts.entries()]
    .filter(([, n]) => n > 1)
    .map(([slug]) => slug);
  return { duplicates, slugs };
}

async function main() {
  if (process.env.USE_STATIC_CATALOG === "true") {
    console.log("USE_STATIC_CATALOG=true — skipping verify (CMS tools not used).");
    process.exit(0);
  }

  const { duplicates, slugs: staticSlugs } = staticSlugIssues();
  if (duplicates.length) {
    console.error(
      "Static catalog has duplicate slugs (last wins in merge; fix data):",
      duplicates.join(", "),
    );
    process.exit(1);
  }

  let cmsSlugs: Set<string>;
  try {
    cmsSlugs = await allToolSlugsFromCms();
  } catch (e) {
    console.error("Could not reach Payload (database / PAYLOAD_SECRET).", e);
    process.exit(1);
  }

  const missing = [...staticSlugs].filter((s) => !cmsSlugs.has(s)).sort();
  if (missing.length === 0) {
    console.log(
      `OK: all ${staticSlugs.size} static tool slugs exist in catalog-tools.`,
    );
    process.exit(0);
  }

  console.error(
    `Missing ${missing.length} tool(s) in Payload (shown on site via static merge, absent in admin):\n`,
    missing.join("\n"),
  );
  console.error("\nFix: from site/ run  npm run seed:catalog");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
