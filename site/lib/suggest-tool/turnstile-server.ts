import {
  getTurnstilePublicKeySource,
  resolveTurnstileSiteKey,
  sanitizeTurnstileCredential,
} from "./turnstile-public";

/**
 * Cloudflare Turnstile **dummy secret** (pairs with test site key). Server-only.
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SECRET_KEY =
  "1x0000000000000000000000000000000AA";

function readSecretEnv(
  name: "TURNSTILE_SECRET_KEY_PRODUCTION" | "TURNSTILE_SECRET_KEY",
): string | undefined {
  if (typeof process === "undefined") return undefined;
  const raw = process.env[name];
  if (raw == null || raw === "") return undefined;
  const s = sanitizeTurnstileCredential(raw);
  return s || undefined;
}

function warnIfSecretEqualsSiteKey(secret: string): void {
  const site = resolveTurnstileSiteKey();
  if (site && secret === site) {
    console.error(
      "[turnstile] TURNSTILE_SECRET_* equals the active site key. In Cloudflare Turnstile, copy **Secret key** into Vercel (Site key and Secret key are different strings).",
    );
  }
}

/**
 * Secret for `/api/suggest-tool` verification — **must pair with the active site key**:
 * - If `NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION` is set → **only** `TURNSTILE_SECRET_KEY_PRODUCTION`
 *   (same widget in Cloudflare). Do not rely on `TURNSTILE_SECRET_KEY` for another widget.
 * - Else if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set → **only** `TURNSTILE_SECRET_KEY`.
 * - Development: `TURNSTILE_SECRET_KEY` when using a non-test site key, else test secret.
 */
export function resolveTurnstileSecret(): string {
  const source = getTurnstilePublicKeySource();
  const prodSecret = readSecretEnv("TURNSTILE_SECRET_KEY_PRODUCTION");
  const generalSecret = readSecretEnv("TURNSTILE_SECRET_KEY");

  if (process.env.NODE_ENV === "production") {
    if (source === "production") {
      if (!prodSecret) {
        throw new Error(
          "Turnstile: set TURNSTILE_SECRET_KEY_PRODUCTION to the secret for the same widget as NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION. (Do not use TURNSTILE_SECRET_KEY alone when the production site key is set — Cloudflare returns invalid-input-secret.)",
        );
      }
      warnIfSecretEqualsSiteKey(prodSecret);
      return prodSecret;
    }
    if (source === "general") {
      if (!generalSecret) {
        throw new Error(
          "Turnstile: set TURNSTILE_SECRET_KEY to match NEXT_PUBLIC_TURNSTILE_SITE_KEY. For Vercel Production-only keys, use NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION + TURNSTILE_SECRET_KEY_PRODUCTION together.",
        );
      }
      warnIfSecretEqualsSiteKey(generalSecret);
      return generalSecret;
    }
    const value = prodSecret || generalSecret;
    if (!value) {
      throw new Error(
        "Turnstile secret is missing in production. Set TURNSTILE_SECRET_KEY_PRODUCTION (with NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION) or TURNSTILE_SECRET_KEY (with NEXT_PUBLIC_TURNSTILE_SITE_KEY).",
      );
    }
    warnIfSecretEqualsSiteKey(value);
    return value;
  }

  if (source === "general" && generalSecret) {
    warnIfSecretEqualsSiteKey(generalSecret);
    return generalSecret;
  }
  const fallback = generalSecret || TURNSTILE_TEST_SECRET_KEY;
  warnIfSecretEqualsSiteKey(fallback);
  return fallback;
}
