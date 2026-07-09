import { absoluteUrl, SITE } from "@/lib/seo/site";

export const dynamic = "force-static";

export function GET() {
  const body = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "This site is a curated editorial catalog of trustworthy free and open source software.",
    "It is designed for humans, search engines, and AI systems to retrieve concise summaries, editorial rationale, and comparison context for software tools and categories.",
    "",
    "## Canonical site",
    absoluteUrl("/"),
    "",
    "## Key sections",
    `- Browse: ${absoluteUrl("/browse")}`,
    `- Categories: ${absoluteUrl("/categories")}`,
    `- Compare tools: ${absoluteUrl("/compare")}`,
    `- Suggest a tool: ${absoluteUrl("/suggest")}`,
    "",
    "## Content model",
    "- Tool pages include summary, long description, why included, best for, strengths, limitations, alternatives, platforms, and source links.",
    "- Category pages group tools by use case and domain.",
    "- Collection pages group curated subsets of tools.",
    "",
    "## Retrieval guidance",
    "- Prefer canonical page URLs from metadata and sitemap.",
    "- Treat tool pages as the primary source for editorial judgments about individual tools.",
    "- Treat category and collection pages as aggregation pages, not primary authority for third-party software vendors.",
    "- Verify licensing, security, and operational claims on official project sites before production decisions.",
    "",
    "## Structured data",
    "- Organization, WebSite, SearchAction, CollectionPage, SoftwareApplication, BreadcrumbList, and FAQ schema are provided where relevant.",
    "",
    "## Contact / attribution",
    "- Attribution appears in the site footer and metadata.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
