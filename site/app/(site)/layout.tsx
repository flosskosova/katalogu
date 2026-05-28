import { Analytics } from "@vercel/analytics/next";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import { CompareBar } from "@/components/catalog/CompareBar";
import { CompareProvider } from "@/components/catalog/CompareProvider";
import { ViewModeProvider } from "@/components/catalog/ViewModeProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import "../globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Local Alfabeti Demi (`site/font`) — header brand, hero, and page titles. */
const alfabetiBrand = localFont({
  src: [
    {
      path: "../../font/5320Alfabeti-Demi.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../font/5320Alfabeti-Demi.woff",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-brand",
  display: "swap",
});

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${alfabetiBrand.variable}`}
    >
      <body>
        <SiteJsonLd />
        <CompareProvider>
          <ViewModeProvider>
          <SkipLink />
          <SiteHeader />
          <main
            id="main"
            className="mx-auto min-h-[60vh] max-w-6xl px-4 pb-28 pt-10 sm:px-6"
          >
            {children}
          </main>
          <SiteFooter />
          <CompareBar />
          </ViewModeProvider>
        </CompareProvider>
        <Analytics />
      </body>
    </html>
  );
}
