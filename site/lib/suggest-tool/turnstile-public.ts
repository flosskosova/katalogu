/**
 * Cloudflare Turnstile **dummy site key** (always passes; safe to expose in the browser).
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

/**
 * Strip BOM, outer quotes, and line breaks often pasted into Vercel / `.env` by mistake.
 */
export function sanitizeTurnstileCredential(raw: string): string {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1).trim();
  }
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.replace(/\r?\n/g, "").trim();
}

function readPublicEnv(name: "NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION" | "NEXT_PUBLIC_TURNSTILE_SITE_KEY"):
  | string
  | undefined {
  if (typeof process === "undefined") return undefined;
  /** Bracket access so Next.js does not always inline a build-time empty value when env exists only at runtime (e.g. Vercel Runtime-only). */
  const raw = process.env[name];
  if (raw == null || raw === "") return undefined;
  const s = sanitizeTurnstileCredential(raw);
  return s || undefined;
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

/**
 * Which `NEXT_PUBLIC_TURNSTILE_*` site key wins — the server secret must come from the **same**
 * Cloudflare widget tier (see {@link resolveTurnstileSecret} in `turnstile-server.ts`).
 */
export type TurnstilePublicKeySource = "production" | "general" | "none" | "test_default";

export function getTurnstilePublicKeySource(): TurnstilePublicKeySource {
  const production = readPublicEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION");
  const general = readPublicEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  if (process.env.NODE_ENV === "production") {
    if (production) return "production";
    if (general) return "general";
    return "none";
  }
  if (general) return "general";
  return "test_default";
}
