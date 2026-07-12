/** Hostnames that are community/social links, not product homepages. */
export const NON_PRODUCT_SITE_HOSTS = new Set([
  "discord.gg",
  "discord.com",
  "discordapp.com",
  "x.com",
  "twitter.com",
  "t.co",
  "reddit.com",
  "old.reddit.com",
  "youtu.be",
  "youtube.com",
]);

/** Official brand assets / favicon domains that differ from `officialSite` hostname. */
export const TOOL_LOGO_CURATED_SOURCES: Record<string, string[]> = {
  firefox: [
    "https://www.mozilla.org/media/protocol/img/logos/firefox/browser/logo.svg",
    "https://www.google.com/s2/favicons?domain=firefox.com&sz=128",
  ],
  mole: [
    "https://mole.fit/img/favicon-mole-192.png",
    "https://www.google.com/s2/favicons?domain=mole.fit&sz=128",
  ],
  sharpide: [
    "https://raw.githubusercontent.com/MattParkerDev/SharpIDE/main/src/SharpIDE.Photino/favicon.ico",
    "https://raw.githubusercontent.com/MattParkerDev/SharpIDE/main/src/SharpIDE.Godot/Resources/SharpIdeSplash.png",
  ],
  "snipe-it": [
    "https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/png/snipe-it.png",
    "https://raw.githubusercontent.com/snipe/snipe-it/master/public/img/logo.png",
    "https://www.google.com/s2/favicons?domain=snipeitapp.com&sz=128",
  ],
  "yt-dlp": [
    "https://raw.githubusercontent.com/yt-dlp/yt-dlp/master/devscripts/logo.ico",
    "https://www.google.com/s2/favicons?domain=github.com&sz=128",
  ],
};

/** Map catalog tool slug -> favicon/logo domain (when officialSite hostname is misleading). */
export const TOOL_LOGO_FAVICON_DOMAIN: Record<string, string> = {
  firefox: "firefox.com",
  mole: "mole.fit",
};

export function isProductSiteHostname(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return !NON_PRODUCT_SITE_HOSTS.has(host);
}

export function productSiteHostname(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return isProductSiteHostname(host) ? host : null;
  } catch {
    return null;
  }
}

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
    if (!isProductSiteHostname(host)) return null;
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
