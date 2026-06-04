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
    theme_color: "#ffffff",
    lang: SITE.language,
    icons: [
      {
        src: `${base}${SITE_LOGO_PATH}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
