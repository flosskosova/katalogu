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
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  const sendRemoteIp =
    typeof process !== "undefined" &&
    process.env.TURNSTILE_SITEVERIFY_SEND_REMOTEIP === "1";
  const ip = sendRemoteIp ? options?.remoteIp?.trim() : undefined;
  if (ip && ip !== "unknown") {
    body.set("remoteip", ip);
  }

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!res.ok) {
    return { success: false, errorCodes: [`http_${res.status}`] };
  }
  const data = (await res.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };
  if (data.success === true) {
    return { success: true };
  }
  const codes = data["error-codes"];
  if (codes?.length) {
    console.warn("[turnstile] siteverify failed", codes);
  }
  return { success: false, errorCodes: codes };
}
