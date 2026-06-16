/**
 * Temporary bypass for the public suggest form and `POST /api/suggest-tool`.
 * Set `DISABLE_SUGGEST_TURNSTILE=1` (or `true` / `yes`) in the deployment env, redeploy, then remove.
 * Do not leave enabled on a public catalog long-term.
 */
export function isSuggestTurnstileDisabled(): boolean {
  const v = process.env.DISABLE_SUGGEST_TURNSTILE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
