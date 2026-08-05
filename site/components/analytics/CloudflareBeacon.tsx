/**
 * Cloudflare Web Analytics beacon — must be a real SSR <script> in <body>.
 * Token is also passed in the script URL so React HTML-escaping of
 * data-cf-beacon cannot prevent the beacon from receiving the token.
 */
const CF_BEACON_TOKEN = "f058a3a134a743858a8812a20c890aaa";

export function CloudflareBeacon() {
  return (
    <>
      {/* Cloudflare Web Analytics */}
      <script
        defer
        src={`https://static.cloudflareinsights.com/beacon.min.js?token=${CF_BEACON_TOKEN}`}
        data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
      />
      {/* End Cloudflare Web Analytics */}
    </>
  );
}
