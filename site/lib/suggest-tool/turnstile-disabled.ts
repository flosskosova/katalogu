/**
 * Turnstile is **off** for the suggest form and `POST /api/suggest-tool` while this is `true`.
 * Set to `false` once Cloudflare widget + Vercel keys are fixed, then redeploy.
 */
export const SUGGEST_TURNSTILE_DISABLED = true;

export function isSuggestTurnstileDisabled(): boolean {
  return SUGGEST_TURNSTILE_DISABLED;
}
