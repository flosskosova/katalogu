/**
 * Cloudflare Turnstile **dummy site key** (always passes; safe to expose in the browser).
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

function readPublicEnv(name: "NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION" | "NEXT_PUBLIC_TURNSTILE_SITE_KEY"):
  | string
  | undefined {
  if (typeof process === "undefined") return undefined;
  /** Bracket access so Next.js does not always inline a build-time empty value when env exists only at runtime (e.g. Vercel Runtime-only). */
  return process.env[name]?.trim();
}

/**
 * Widget site key for the suggest form.
 * Uses bracket `process.env[...]` so Next.js is less likely to inline an empty build-time value
 * when `NEXT_PUBLIC_*` exists only at **runtime** (e.g. Vercel env scoped to Runtime without Build).
 *
 * Call this from **Server Components** (and pass the string into client widgets) so production
 * matches what `/api/suggest-tool` sees; avoid relying on a client-only module-level read alone.
 */
export function resolveTurnstileSiteKey(): string {
  const production = readPublicEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION");
  const general = readPublicEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  if (process.env.NODE_ENV === "production") {
    return production || general || "";
  }
  return general || TURNSTILE_TEST_SITE_KEY;
}
