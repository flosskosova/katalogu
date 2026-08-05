import { getCloudflareBeaconToken } from "@/lib/seo/analytics";

/**
 * Cloudflare Web Analytics — plain <script defer> so the tag is in the SSR HTML.
 * next/script (especially type="module") can break beacon token detection via
 * document.currentScript and leave the dashboard empty.
 */
export function CloudflareBeacon() {
  const token = getCloudflareBeaconToken();
  if (!token) return null;

  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token, spa: true })}
    />
  );
}
