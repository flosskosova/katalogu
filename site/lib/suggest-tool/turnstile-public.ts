/**
 * Cloudflare Turnstile **dummy site key** (always passes; safe to expose in the browser).
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

/**
 * Widget site key for the suggest form.
 * - **Production builds** (`NODE_ENV=production`): `NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION`, then `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, then test key.
 * - **Development**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, then test key.
 */
export function resolveTurnstileSiteKey(): string {
  const production = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION?.trim();
  const general = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (process.env.NODE_ENV === "production") {
    return production || general || TURNSTILE_TEST_SITE_KEY;
  }
  return general || TURNSTILE_TEST_SITE_KEY;
}
