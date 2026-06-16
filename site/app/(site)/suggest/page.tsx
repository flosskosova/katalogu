import type { Metadata } from "next";
import { SuggestToolForm } from "@/components/suggest/SuggestToolForm";
import { isSuggestTurnstileDisabled } from "@/lib/suggest-tool/turnstile-disabled";
import { resolveTurnstileSiteKey } from "@/lib/suggest-tool/turnstile-public";
import { absoluteUrl, SITE } from "@/lib/seo/site";

/** Read Turnstile site key per request so it matches serverless `/api/suggest-tool` (not a stale build-inlined `NEXT_PUBLIC_*`). */
export const dynamic = "force-dynamic";

const desc =
  "Suggest a free and open source application or tool for the OpenCatalog editorial team to review. Include the repository, a short description, and your contact email.";

export const metadata: Metadata = {
  title: "Suggest a FOSS app or tool",
  description: desc,
  keywords: [...SITE.keywords, "suggest open source", "submit FOSS", "catalog suggestion"],
  alternates: {
    canonical: "/suggest",
    languages: { en: absoluteUrl("/suggest") },
  },
  openGraph: {
    title: `Suggest a FOSS app or tool · ${SITE.name}`,
    description: desc,
    type: "website",
    url: absoluteUrl("/suggest"),
    siteName: SITE.name,
    locale: SITE.locale,
    images: [
      { url: "/opengraph-image", width: 1200, height: 630, alt: SITE.name },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Suggest a FOSS app or tool · ${SITE.name}`,
    description: desc,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function SuggestPage() {
  const turnstileSiteKey = resolveTurnstileSiteKey();
  const turnstileDisabled = isSuggestTurnstileDisabled();
  return (
    <div className="max-w-2xl">
      <h1 className="font-[family-name:var(--font-brand)] text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Suggest a FOSS app or tool
      </h1>
      <p className="mt-3 text-[var(--foreground-muted)] leading-relaxed">
        Know a trustworthy Free and Open Source project that fits this catalog? Tell us
        about it. Editors review submissions and may follow up by email.
      </p>
      <p className="mt-2 text-sm text-[var(--foreground-subtle)]">
        Submissions are not published automatically. Spam and duplicate entries are
        blocked; please use a real repository URL on GitHub or GitLab.
      </p>
      <div className="mt-10">
        <SuggestToolForm siteKey={turnstileSiteKey} turnstileDisabled={turnstileDisabled} />
      </div>
    </div>
  );
}
