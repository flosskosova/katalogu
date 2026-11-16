import { getGoogleAnalyticsMeasurementId } from "@/lib/seo/analytics";

/**
 * Google Analytics 4 — SSR scripts so Next does not strip the tag.
 * Renders nothing when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset.
 */
export function GoogleAnalytics() {
  const id = getGoogleAnalyticsMeasurementId();
  if (!id) return null;

  return (
    <>
      {/* Google Analytics */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(id)});`,
        }}
      />
      {/* End Google Analytics */}
    </>
  );
}
