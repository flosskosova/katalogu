/** Official brand assets / favicon domains that differ from `officialSite` hostname. */
export const TOOL_LOGO_CURATED_SOURCES: Record<string, string[]> = {
  firefox: [
    "https://www.mozilla.org/media/protocol/img/logos/firefox/browser/logo.svg",
    "https://www.google.com/s2/favicons?domain=firefox.com&sz=128",
  ],
  "snipe-it": [
    "https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/png/snipe-it.png",
    "https://raw.githubusercontent.com/snipe/snipe-it/master/public/img/logo.png",
    "https://www.google.com/s2/favicons?domain=snipeitapp.com&sz=128",
  ],
};

/** Map catalog tool slug -> favicon/logo domain (when officialSite hostname is misleading). */
export const TOOL_LOGO_FAVICON_DOMAIN: Record<string, string> = {
  firefox: "firefox.com",
};

/**
 * Favicon domain for logo fetchers. Mozilla product pages live on mozilla.org but
 * browser logos come from firefox.com (mozilla.org favicon is the corporate M mark).
 */
export function faviconDomainForTool(tool: {
  slug: string;
  officialSite?: string;
  sourceRepo?: string;
}): string | null {
  const override = TOOL_LOGO_FAVICON_DOMAIN[tool.slug];
  if (override) return override;

  const site = tool.officialSite?.trim();
  if (!site) return null;

  try {
    const url = new URL(site);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "mozilla.org" && url.pathname.includes("/firefox")) {
      return "firefox.com";
    }
    return host;
  } catch {
    return null;
  }
}

export function curatedLogoSources(slug: string): string[] {
  return TOOL_LOGO_CURATED_SOURCES[slug] ?? [];
}
