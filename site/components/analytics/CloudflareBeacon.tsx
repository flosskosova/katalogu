import Script from "next/script";
import { getCloudflareBeaconToken } from "@/lib/seo/analytics";

export function CloudflareBeacon() {
  const token = getCloudflareBeaconToken();
  if (!token) return null;

  return (
    <Script
      type="module"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
      strategy="afterInteractive"
    />
  );
}
