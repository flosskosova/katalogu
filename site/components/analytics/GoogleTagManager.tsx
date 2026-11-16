import { getGoogleTagManagerId } from "@/lib/seo/analytics";

/**
 * Google Tag Manager — SSR scripts so Next does not strip the tag.
 * Loads the container that can fire GA4 and other tags from the GTM UI.
 */
export function GoogleTagManager() {
  const id = getGoogleTagManagerId();
  if (!id) return null;

  return (
    <>
      {/* Google Tag Manager */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());`,
        }}
      />
      <script
        async
        src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`}
      />
      {/* End Google Tag Manager */}
    </>
  );
}
