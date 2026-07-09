import manifest from "@/data/tool-logos.json";

/** Resolved logo path/URL for a catalog tool (CMS upload, then local manifest). */
export function getToolLogoSrc(tool: {
  slug: string;
  logoUrl?: string;
}): string | undefined {
  const cms = tool.logoUrl?.trim();
  if (cms) return cms;
  const local = manifest[tool.slug as keyof typeof manifest];
  return typeof local === "string" && local.length > 0 ? local : undefined;
}
