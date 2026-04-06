/**
 * Payload stores relative URLs (e.g. /api/media/file/...). Build absolute URLs for SSR and <img src>.
 */
export function absolutePayloadUrl(
  relativeOrAbsolute: string | undefined | null,
): string | undefined {
  if (!relativeOrAbsolute) return undefined;
  if (
    relativeOrAbsolute.startsWith("http://") ||
    relativeOrAbsolute.startsWith("https://")
  ) {
    return relativeOrAbsolute;
  }
  const base = (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).replace(/\/$/, "");
  const path = relativeOrAbsolute.startsWith("/")
    ? relativeOrAbsolute
    : `/${relativeOrAbsolute}`;
  return base ? `${base}${path}` : path;
}
