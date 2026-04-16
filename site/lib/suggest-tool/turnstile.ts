/**
 * Verifies a Cloudflare Turnstile token (server-side).
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstileToken(
  token: string,
  secret: string,
  options?: { remoteIp?: string },
): Promise<boolean> {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  const ip = options?.remoteIp?.trim();
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

  if (!res.ok) return false;
  const data = (await res.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };
  if (data.success === true) return true;
  if (data["error-codes"]?.length) {
    console.warn("[turnstile] siteverify failed", data["error-codes"]);
  }
  return false;
}
