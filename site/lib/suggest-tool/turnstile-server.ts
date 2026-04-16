/**
 * Cloudflare Turnstile **dummy secret** (pairs with test site key). Server-only.
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SECRET_KEY =
  "1x0000000000000000000000000000000AA";

/**
 * Secret for `/api/suggest-tool` verification.
 * - **Production builds**: `TURNSTILE_SECRET_KEY_PRODUCTION`, then `TURNSTILE_SECRET_KEY`.
 *   Missing production keys are treated as a hard configuration error (fail closed).
 * - **Development**: `TURNSTILE_SECRET_KEY`, then test secret.
 */
export function resolveTurnstileSecret(): string {
  const production = process.env.TURNSTILE_SECRET_KEY_PRODUCTION?.trim();
  const general = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (process.env.NODE_ENV === "production") {
    const value = production || general;
    if (!value) {
      throw new Error(
        "Turnstile secret is missing in production. Set TURNSTILE_SECRET_KEY_PRODUCTION (preferred) or TURNSTILE_SECRET_KEY.",
      );
    }
    return value;
  }
  return general || TURNSTILE_TEST_SECRET_KEY;
}
