/** Cloudflare Web Analytics beacon token (public site only). */
export function getCloudflareBeaconToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN?.trim();
  return token || undefined;
}
