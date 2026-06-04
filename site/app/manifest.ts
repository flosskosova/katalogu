import type { MetadataRoute } from "next";
import { SITE, SITE_LOGO_PATH, getSiteUrl } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  const base = getSiteUrl();
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#fff200",
    lang: SITE.language,
    icons: [
      {
        src: `${base}${SITE_LOGO_PATH}`,
        sizes: "186x153",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
