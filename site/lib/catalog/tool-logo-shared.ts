export const TOOL_LOGO_MANIFEST_URL = "/tool-logos/manifest.json";

export function resolveToolLogoSrc(
  tool: { slug: string; logoUrl?: string },
  manifest: Record<string, string>,
): string | undefined {
  const local = manifest[tool.slug];
  if (typeof local === "string" && local.length > 0) return local;
  const cms = tool.logoUrl?.trim();
  return cms || undefined;
}

export function withResolvedToolLogo<T extends { slug: string; logoUrl?: string }>(
  tool: T,
  manifest: Record<string, string>,
): T {
  const src = resolveToolLogoSrc(tool, manifest);
  return src ? { ...tool, logoUrl: src } : tool;
}

export function withResolvedToolLogos<
  T extends { slug: string; logoUrl?: string },
>(tools: T[], manifest: Record<string, string>): T[] {
  return tools.map((tool) => withResolvedToolLogo(tool, manifest));
}
