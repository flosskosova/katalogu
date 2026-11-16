/** Public Cloudflare Web Analytics token for catalog.flossk.org. */
const DEFAULT_CF_BEACON_TOKEN = "f058a3a134a743858a8812a20c890aaa";

/** Cloudflare Web Analytics beacon token (public site only). */
export function getCloudflareBeaconToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN?.trim();
  return token || DEFAULT_CF_BEACON_TOKEN;
}

/** Public GTM container for catalog.flossk.org (fires GA4 from the GTM UI). */
const DEFAULT_GTM_ID = "GTM-M9X7KQVL";

/** Google Tag Manager container ID (`GTM-…`). */
export function getGoogleTagManagerId(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_GTM_ID?.trim() || DEFAULT_GTM_ID;
  if (!/^GTM-[A-Z0-9]+$/i.test(raw)) return undefined;
  return raw.toUpperCase();
}
