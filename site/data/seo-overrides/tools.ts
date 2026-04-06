/**
 * Hand-tuned SEO for high-traffic or nuanced entries (optional).
 * Descriptions are clipped at apply time to ~158 chars if longer.
 */
export const TOOL_SEO_OVERRIDES: Record<
  string,
  { seoTitle?: string; seoDescription?: string }
> = {
  immortalwrt: {
    seoTitle: "ImmortalWrt: OpenWrt router firmware fork · OpenCatalog",
    seoDescription:
      "Open-source router OS based on OpenWrt with more packages and device targets, widely used for advanced home networking. GPL-2.0. Official site, source, and vetted alternatives on OpenCatalog.",
  },
};
