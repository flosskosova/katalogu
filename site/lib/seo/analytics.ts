/** Public Cloudflare Web Analytics token for catalog.flossk.org. */
const DEFAULT_CF_BEACON_TOKEN = "f058a3a134a743858a8812a20c890aaa";

/** Cloudflare Web Analytics beacon token (public site only). */
export function getCloudflareBeaconToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN?.trim();
  return token || DEFAULT_CF_BEACON_TOKEN;
}
