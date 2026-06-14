/**
 * Verifies a Cloudflare Turnstile token (server-side).
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * **`remoteip` is omitted by default.** On Vercel/CDNs, `x-forwarded-for` can differ from the IP
 * Cloudflare associated with the token, and including a wrong `remoteip` makes `siteverify` return
 * `success: false` even when the widget showed success.
 *
 * Set **`TURNSTILE_SITEVERIFY_SEND_REMOTEIP=1`** only if you control accurate client IP forwarding
 * and need the extra check.
 */
export async function verifyTurnstileToken(
  token: string,
  secret: string,
  options?: { remoteIp?: string },
): Promise<{ success: boolean; errorCodes?: string[] }> {
  const responseToken = token.trim();
  const secretTrimmed = secret.trim();
  const sendRemoteIp =
    typeof process !== "undefined" &&
    process.env.TURNSTILE_SITEVERIFY_SEND_REMOTEIP === "1";
  const ip = sendRemoteIp ? options?.remoteIp?.trim() : undefined;

  const payload: { secret: string; response: string; remoteip?: string } = {
    secret: secretTrimmed,
    response: responseToken,
  };
  if (ip && ip !== "unknown") {
    payload.remoteip = ip;
  }

  let res: Response;
  try {
    /** JSON avoids Node/undici quirks with `URLSearchParams` + manual `Content-Type` (seen as HTTP 400 from siteverify). @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ */
    res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("[turnstile] siteverify fetch failed", err);
    return { success: false, errorCodes: ["fetch_failed"] };
  }

  const raw = await res.text();
  let data: { success?: boolean; "error-codes"?: string[] };
  try {
    data = raw ? (JSON.parse(raw) as typeof data) : {};
  } catch {
    console.warn(
      "[turnstile] siteverify non-JSON body",
      res.status,
      raw.slice(0, 200),
    );
    return { success: false, errorCodes: [`http_${res.status}`, "invalid_json_body"] };
  }

  if (data.success === true) {
    return { success: true };
  }

  const codes = data["error-codes"] ?? [];
  if (!res.ok) {
    console.warn(
      "[turnstile] siteverify HTTP error",
      res.status,
      codes.length ? codes : "(no error-codes in body)",
      raw.length > 400 ? `${raw.slice(0, 400)}…` : raw,
    );
    return {
      success: false,
      errorCodes: codes.length > 0 ? codes : [`http_${res.status}`],
    };
  }

  if (codes.length) {
    console.warn("[turnstile] siteverify failed", codes);
  }
  return { success: false, errorCodes: codes };
}
