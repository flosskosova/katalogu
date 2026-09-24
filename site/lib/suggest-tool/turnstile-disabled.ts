/**
 * Turnstile protects the suggest form and `POST /api/suggest-tool` when this is `false`.
 * Production needs `NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION` and
 * `TURNSTILE_SECRET_KEY_PRODUCTION` from the same Cloudflare widget.
 */
export const SUGGEST_TURNSTILE_DISABLED = false;

export function isSuggestTurnstileDisabled(): boolean {
  return SUGGEST_TURNSTILE_DISABLED;
}
