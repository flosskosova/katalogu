import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveToolLogoSrc, withResolvedToolLogos } from "@/lib/catalog/tool-logo-shared";

export { resolveToolLogoSrc, TOOL_LOGO_MANIFEST_URL, withResolvedToolLogos } from "@/lib/catalog/tool-logo-shared";

let serverManifest: Record<string, string> | null = null;

/** Read logo manifest at request time (works without rebundling after deploy). */
export function loadToolLogoManifestSync(): Record<string, string> {
  if (serverManifest) return serverManifest;
  const candidates = [
    path.join(process.cwd(), "public/tool-logos/manifest.json"),
    path.join(process.cwd(), "data/tool-logos.json"),
  ];
  for (const file of candidates) {
    try {
      serverManifest = JSON.parse(readFileSync(file, "utf8")) as Record<
        string,
        string
      >;
      return serverManifest;
    } catch {
      // try next path
    }
  }
  serverManifest = {};
  return serverManifest;
}

/** Server components / RSC — filesystem manifest. */
export function getToolLogoSrc(tool: {
  slug: string;
  logoUrl?: string;
}): string | undefined {
  return resolveToolLogoSrc(tool, loadToolLogoManifestSync());
}
