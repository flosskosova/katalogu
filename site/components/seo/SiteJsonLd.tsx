import { JsonLd } from "@/components/catalog/JsonLd";
import { buildSiteGraphJsonLd } from "@/lib/seo/structured-data";

/** Sitewide Organization + WebSite + SearchAction (every public page). */
export function SiteJsonLd() {
  return <JsonLd data={buildSiteGraphJsonLd()} />;
}
