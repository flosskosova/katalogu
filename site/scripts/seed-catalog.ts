/**
 * Idempotent: static `data/categories.ts` + `data/tools.ts` → Payload.
 * Run from `site/`: `npm run seed:catalog` (loads `.env` via Node — set secrets there)
 *
 * - Creates missing categories, tags, and tools so admin lists match merged public catalog.
 * - Exits with error if any static tool could not be created (e.g. unknown categorySlug).
 * - Afterward run `npm run verify:catalog-sync` in CI to catch drift.
 *
 * Creates an admin user if missing (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
 * Requires PAYLOAD_SECRET; database: DATABASE_URL or default data/payload.sqlite
 */
import { existsSync, mkdirSync } from "fs";
import path from "path";
import type { Payload } from "payload";
import { createJiti } from "jiti";
import { isCatalogToolSlugValid } from "../lib/catalog-tool-slug";
import {
  categorySeoPatchFromStatic,
  toolSeoPatchFromStatic,
} from "../payload/seo-defaults";

async function loadPayloadConfig() {
  const siteRoot = process.cwd();
  const jiti = createJiti(import.meta.url, {
    alias: { "@": siteRoot },
  });
  const mod = (await jiti.import(path.join(siteRoot, "payload.config.ts"))) as {
    default: unknown;
  };
  return mod.default;
}

function relationIdPresent(v: unknown): boolean {
  if (v == null || v === "") return false;
  if (typeof v === "number") return true;
  if (typeof v === "string") return v.length > 0;
  if (typeof v === "object" && v !== null && "id" in v)
    return (v as { id?: unknown }).id != null;
  return true;
}

function slugifyTag(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "tag";
}

async function ensureAdminUser(payload: Payload) {
  const email =
    process.env.SEED_ADMIN_EMAIL?.trim() || "admin@example.com";
  const password =
    process.env.SEED_ADMIN_PASSWORD?.trim() || "changeme";

  const found = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (found.docs[0]) {
    return found.docs[0];
  }

  return payload.create({
    collection: "users",
    data: {
      email,
      password,
      role: "admin",
    },
    overrideAccess: true,
  });
}

async function main() {
  const { getPayload } = await import("payload");
  const config = await loadPayloadConfig();
  const { categories: staticCategories } = await import("../data/categories");
  const { withProprietaryAlternativeNote } = await import(
    "../data/proprietary-alternatives"
  );
  const { tools: staticTools } = await import("../data/tools");

  const badSlugs = staticTools.filter((t) => !isCatalogToolSlugValid(t.slug));
  if (badSlugs.length) {
    console.error(
      "Static tool slugs must match Payload catalog-tools rules (lowercase a-z, 0-9, hyphen segments). Fix:",
    );
    for (const t of badSlugs) console.error(`  ${t.slug} (${t.name})`);
    process.exit(1);
  }

  const dataDir = path.join(process.cwd(), "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const payload = await getPayload({ config });
  const adminUser = await ensureAdminUser(payload);

  const catIdBySlug = new Map<string, string | number>();

  for (const c of staticCategories) {
    const existing = await payload.find({
      collection: "catalog-categories",
      where: { slug: { equals: c.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      const doc = existing.docs[0] as Record<string, unknown>;
      catIdBySlug.set(c.slug, doc.id as string | number);
      const defaults = categorySeoPatchFromStatic(c);
      const patch: Record<string, unknown> = {};
      if (!String(doc.seoTitle ?? "").trim()) patch.seoTitle = defaults.seoTitle;
      if (!String(doc.seoDescription ?? "").trim()) {
        patch.seoDescription = defaults.seoDescription;
      }
      if (!String(doc.canonicalSlug ?? "").trim()) {
        patch.canonicalSlug = defaults.canonicalSlug;
      }
      if (
        !relationIdPresent(doc.ogImage) &&
        relationIdPresent(doc.icon)
      ) {
        patch.ogImage = doc.icon;
      }
      if (Object.keys(patch).length) {
        await payload.update({
          collection: "catalog-categories",
          id: doc.id as string | number,
          data: patch,
          user: adminUser,
          overrideAccess: true,
        });
        console.log("Category SEO backfill:", c.slug);
      }
      continue;
    }
    const created = await payload.create({
      collection: "catalog-categories",
      data: {
        name: c.name,
        slug: c.slug,
        summary: c.summary,
        description: c.description,
        ...categorySeoPatchFromStatic(c),
        status: "published",
        featured: false,
        sortOrder: 0,
      },
      user: adminUser,
      overrideAccess: true,
    });
    catIdBySlug.set(c.slug, created.id);
    console.log("Category:", c.slug);
  }

  const tagIdByName = new Map<string, string | number>();
  const allTagNames = new Set<string>();
  staticTools.forEach((t) => t.tags.forEach((tag) => allTagNames.add(tag)));

  const usedSlugs = new Set<string>();

  for (const name of allTagNames) {
    let slug = slugifyTag(name);
    let n = 1;
    while (usedSlugs.has(slug)) {
      n += 1;
      slug = `${slugifyTag(name)}-${n}`;
    }
    usedSlugs.add(slug);

    const existing = await payload.find({
      collection: "catalog-tags",
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      tagIdByName.set(name, existing.docs[0].id);
      continue;
    }
    const created = await payload.create({
      collection: "catalog-tags",
      data: {
        name,
        slug,
        tagType: "editorial",
        sortOrder: 0,
      },
      user: adminUser,
      overrideAccess: true,
    });
    tagIdByName.set(name, created.id);
  }

  const toolIdBySlug = new Map<string, string | number>();
  const skippedNoCategory: string[] = [];

  for (const raw of staticTools) {
    const t = withProprietaryAlternativeNote(raw);
    const existing = await payload.find({
      collection: "catalog-tools",
      where: { slug: { equals: t.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      const doc = existing.docs[0] as Record<string, unknown>;
      toolIdBySlug.set(t.slug, doc.id as string | number);
      const defaults = toolSeoPatchFromStatic({
        name: t.name,
        slug: t.slug,
        summary: t.summary,
        whyIncluded: t.whyIncluded,
        license: t.license,
      });
      const patch: Record<string, unknown> = {};
      if (!String(doc.seoTitle ?? "").trim()) patch.seoTitle = defaults.seoTitle;
      if (!String(doc.seoDescription ?? "").trim()) {
        patch.seoDescription = defaults.seoDescription;
      }
      if (!String(doc.canonicalSlug ?? "").trim()) {
        patch.canonicalSlug = defaults.canonicalSlug;
      }
      if (
        !relationIdPresent(doc.ogImage) &&
        relationIdPresent(doc.logo)
      ) {
        patch.ogImage = doc.logo;
      }
      const oldWhy = String(doc.whyIncluded ?? "");
      if (
        oldWhy.includes("Listed in [") &&
        oldWhy.includes("](https://github.com/") &&
        t.whyIncluded !== oldWhy
      ) {
        patch.whyIncluded = t.whyIncluded;
      }
      /** Thin og:title-only backfills that should be replaced by richer static copy */
      const replaceWhyIfWas: Partial<Record<string, string>> = {
        homebrew: "The Missing Package Manager for macOS (or Linux).",
      };
      const stale = replaceWhyIfWas[t.slug];
      if (stale && oldWhy === stale && t.whyIncluded !== oldWhy) {
        patch.whyIncluded = t.whyIncluded;
      }
      if (Object.keys(patch).length) {
        await payload.update({
          collection: "catalog-tools",
          id: doc.id as string | number,
          data: patch,
          user: adminUser,
          overrideAccess: true,
        });
        console.log("Tool backfill (SEO and/or whyIncluded):", t.slug);
      } else {
        console.log("Skip existing tool:", t.slug);
      }
      continue;
    }

    const catId = catIdBySlug.get(t.categorySlug);
    if (!catId) {
      skippedNoCategory.push(`${t.slug} (categorySlug: ${t.categorySlug})`);
      continue;
    }

    const tagList = t.tags
      .map((name) => tagIdByName.get(name))
      .filter(Boolean) as (string | number)[];

    try {
      const created = await payload.create({
        collection: "catalog-tools",
        data: {
          name: t.name,
          slug: t.slug,
          ...toolSeoPatchFromStatic({
            name: t.name,
            slug: t.slug,
            summary: t.summary,
            whyIncluded: t.whyIncluded,
            license: t.license,
          }),
          status: "published",
          category: catId,
          rank: t.rank,
          editorialWeight: t.editorialWeight ?? 0,
          featured: false,
          summary: t.summary,
          whyIncluded: t.whyIncluded,
          bestFor: t.bestFor,
          targetUsers:
            "Developers, teams, and individuals evaluating open tools in this category — refine in CMS for specificity.",
          platforms: t.platforms.map((platform) => ({ platform })),
          license: t.license,
          openSourceStatus: "osi-approved",
          maintenanceStatus: t.maintenanceStatus,
          maturity: t.maturity,
          officialSite: t.officialSite,
          sourceRepo: t.sourceRepo,
          strengths: t.strengths.map((line) => ({ line })),
          limitations: t.limitations.map((line) => ({ line })),
          alternatives: t.alternatives.map((line) => ({ line })),
          ...(t.replacesProprietary?.trim()
            ? { replacesProprietary: t.replacesProprietary.trim() }
            : {}),
          privacyFocused: Boolean(t.privacyFocused),
          selfHosted: Boolean(t.selfHosted),
          beginnerFriendly: Boolean(t.beginnerFriendly),
          developerFocused: t.tags.some(
            (x) => x.toLowerCase() === "developer" || x.toLowerCase() === "dev",
          ),
          endUserFocused: t.tags.some(
            (x) =>
              x.toLowerCase() === "end-user" ||
              x.toLowerCase() === "end user" ||
              x.toLowerCase().includes("beginner"),
          ),
          tagList,
          publishedAt: new Date().toISOString(),
        },
        user: adminUser,
        overrideAccess: true,
      });
      toolIdBySlug.set(t.slug, created.id);
      console.log("Tool:", t.slug);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Turso/libSQL can surface concurrent seed attempts as UNIQUE constraint failures.
      if (msg.includes("UNIQUE constraint failed") && msg.includes("slug")) {
        const refetch = await payload.find({
          collection: "catalog-tools",
          where: { slug: { equals: t.slug } },
          limit: 1,
          overrideAccess: true,
        });
        const doc = refetch.docs[0] as Record<string, unknown> | undefined;
        if (doc?.id != null) {
          toolIdBySlug.set(t.slug, doc.id as string | number);
          console.log("Skip existing tool (constraint):", t.slug);
          continue;
        }
      }
      throw e;
    }
  }

  for (const t of staticTools) {
    const rel = t.relatedSlugs;
    if (!rel?.length) continue;
    const id = toolIdBySlug.get(t.slug);
    if (!id) continue;
    const relatedIds = rel
      .map((s) => toolIdBySlug.get(s))
      .filter(Boolean) as (string | number)[];

    if (!relatedIds.length) continue;

    await payload.update({
      collection: "catalog-tools",
      id,
      data: { relatedTools: relatedIds },
      user: adminUser,
      overrideAccess: true,
    });
  }

  const staticSlugs = [...new Set(staticTools.map((t) => t.slug))];
  const missingAfterSeed = staticSlugs.filter((s) => !toolIdBySlug.has(s));

  if (skippedNoCategory.length) {
    console.error(
      "Seed failed — static tools reference unknown categories:\n",
      skippedNoCategory.join("\n"),
    );
    process.exit(1);
  }

  if (missingAfterSeed.length) {
    console.error(
      "Seed failed — static tools not present in Payload after run:\n",
      missingAfterSeed.join("\n"),
    );
    process.exit(1);
  }

  console.log(
    `Seed complete. ${staticSlugs.length} static tool slugs synced to catalog-tools.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
