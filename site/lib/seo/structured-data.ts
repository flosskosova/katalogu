import type { Category, CuratedCollectionView, Tool } from "@/lib/types";
import {
  absoluteUrl,
  getOrganizationLegalName,
  orgId,
  parseSameAsUrls,
  SITE,
  SITE_LOGO_PATH,
  websiteId,
} from "@/lib/seo/site";

type JsonObject = Record<string, unknown>;

export function buildOrganizationJsonLd(): JsonObject {
  const sameAs = parseSameAsUrls();
  return {
    "@type": "Organization",
    "@id": orgId(),
    name: getOrganizationLegalName(),
    alternateName: SITE.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(SITE_LOGO_PATH),
    description: SITE.description,
    knowsAbout: [
      "Open source software",
      "Free and open-source software",
      "FOSS",
      "Software licensing",
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function buildWebSiteJsonLd(): JsonObject {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    name: SITE.name,
    alternateName: SITE.tagline,
    url: absoluteUrl("/"),
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { "@id": orgId() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/browse")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildSiteGraphJsonLd(): JsonObject {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationJsonLd(), buildWebSiteJsonLd()],
  };
}

function breadcrumbListValue(items: { name: string; path: string }[]): JsonObject {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function buildSoftwareApplicationJsonLd(
  tool: Tool,
  category: Category,
): JsonObject {
  const pageUrl = absoluteUrl(
    `/tools/${tool.canonicalSlug?.trim() || tool.slug}`,
  );
  const desc =
    tool.seoDescription?.trim() ||
    tool.summary ||
    `${tool.name} — ${category.name} on ${SITE.name}.`;

  const webPage: JsonObject = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: tool.seoTitle?.trim() || tool.name,
    description: desc,
    isPartOf: { "@id": websiteId() },
    about: { "@id": `${pageUrl}#software` },
    breadcrumb: breadcrumbListValue([
      { name: "Home", path: "/" },
      { name: "Browse", path: "/browse" },
      { name: category.name, path: `/categories/${category.slug}` },
      {
        name: tool.name,
        path: `/tools/${tool.canonicalSlug?.trim() || tool.slug}`,
      },
    ]),
  };
  if (tool.ogImageUrl) {
    webPage.primaryImageOfPage = {
      "@type": "ImageObject",
      url: tool.ogImageUrl,
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#software`,
        name: tool.name,
        description: desc,
        applicationCategory: category.name,
        operatingSystem: tool.platforms.join(", "),
        license: tool.license,
        url: tool.officialSite,
        codeRepository: tool.sourceRepo,
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        publisher: { "@id": orgId() },
        mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
      },
      webPage,
    ],
  };
}

export function buildCollectionPageJsonLd(
  cat: Category,
  tools: Pick<Tool, "slug" | "name">[],
): JsonObject {
  const pageUrl = absoluteUrl(
    `/categories/${cat.canonicalSlug?.trim() || cat.slug}`,
  );
  const title = cat.seoTitle?.trim() || `${cat.name} — open source tools`;
  const desc =
    cat.seoDescription?.trim() ||
    cat.summary ||
    `${cat.name} category on ${SITE.name}: curated open source software.`;

  const slice = tools.slice(0, 48);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collectionpage`,
        url: pageUrl,
        name: title,
        description: desc,
        isPartOf: { "@id": websiteId() },
        about: {
          "@type": "Thing",
          name: cat.name,
          description: cat.description,
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: tools.length,
          itemListElement: slice.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.name,
            url: absoluteUrl(`/tools/${t.slug}`),
          })),
        },
        breadcrumb: breadcrumbListValue([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: cat.name, path: `/categories/${cat.slug}` },
        ]),
      },
    ],
  };
}

export function buildCuratedCollectionJsonLd(col: CuratedCollectionView): JsonObject {
  const pageUrl = absoluteUrl(`/collections/${col.slug}`);
  const title = col.seoTitle?.trim() || col.name;
  const desc =
    col.seoDescription?.trim() ||
    col.description ||
    `${col.name} — curated open source tools on ${SITE.name}.`;

  const slice = col.items.slice(0, 48).map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.tool.name,
    url: absoluteUrl(`/tools/${it.tool.slug}`),
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        url: pageUrl,
        name: title,
        description: desc,
        isPartOf: { "@id": websiteId() },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: col.items.length,
          itemListElement: slice,
        },
        breadcrumb: breadcrumbListValue([
          { name: "Home", path: "/" },
          { name: "Browse", path: "/browse" },
          { name: col.name, path: `/collections/${col.slug}` },
        ]),
      },
    ],
  };
}

export function buildHomeFaqJsonLd(): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${SITE.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${SITE.name} is an editorial catalog of free and open source software (FOSS), co-authored by FLOSSK, CyberFuzz, and AI. It highlights actively maintained tools with clear documentation and practical adoption—not a complete directory of every OSS project.`,
        },
      },
      {
        "@type": "Question",
        name: "How are tools selected for the catalog?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Entries are curated using editorial criteria: open license, evidence of maintenance, documentation quality, and real-world usefulness. Each listing explains why the tool is included, with strengths and limitations.",
        },
      },
      {
        "@type": "Question",
        name: "Can I compare open source tools on the site?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. Use Compare from browse or tool pages to see license, maturity, platforms, and editorial fields side by side on ${absoluteUrl("/compare")}.`,
        },
      },
    ],
  };
}
