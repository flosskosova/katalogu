import type { MetadataRoute } from "next";
import { SITE, getSiteUrl } from "@/lib/seo/site";

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
        src: `${base}/icon.png`,
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/apple-icon.png`,
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${base}/favicon.ico`,
        sizes: "32x32",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
