import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  SITE,
  absoluteUrl,
  getGoogleSiteVerification,
  getSiteUrl,
  getTwitterCreator,
  getTwitterSite,
} from "@/lib/seo/site";

const coAuthors = [
  { name: "FLOSSK" },
  { name: "CyberFuzz" },
  { name: "AI" },
] as const;

/**
 * Minimal root: no <html>/<body> here so Payload admin can render its own document
 * via `app/(payload)/layout.tsx` without nesting <html> inside <body>.
 * Public pages get `<html>` from `app/(site)/layout.tsx`.
 */
const verification = getGoogleSiteVerification()
  ? { google: getGoogleSiteVerification()! }
  : undefined;

/** Avoid root layout throw if env URL is malformed (would 500 every route including /admin). */
function safeMetadataBase(): URL | undefined {
  try {
    const u = getSiteUrl();
    if (!u || !/^https?:\/\//i.test(u)) return undefined;
    return new URL(u);
  } catch {
    return undefined;
  }
}

const metadataBaseResolved = safeMetadataBase();

export const metadata: Metadata = {
  ...(metadataBaseResolved ? { metadataBase: metadataBaseResolved } : {}),
  applicationName: SITE.name,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  authors: [...coAuthors],
  creator: "FLOSSK, CyberFuzz & AI",
  publisher: SITE.name,
  category: "technology",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: absoluteUrl("/"),
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: getTwitterSite(),
    creator: getTwitterCreator(),
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(verification ? { verification } : {}),
  /**
   * Favicon + Apple touch: `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`.
   * use `public/black.svg` via `SITE_LOGO_PATH`. Next injects icon links automatically.
   */
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
