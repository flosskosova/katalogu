import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Payload’s REST `POST /api/users/logout` only sends `Set-Cookie` to expire the token after
 * `logoutOperation` runs, and that operation throws when `req.user` is missing (e.g. CSRF / JWT
 * extraction mismatch). This route always expires Payload auth cookies for the current request,
 * using the same Path/HttpOnly/SameSite shape as Payload defaults so the browser actually drops them.
 */
export async function POST() {
  const prefix = process.env.PAYLOAD_COOKIE_PREFIX?.trim() || "payload";
  const tokenName = `${prefix}-token`;
  /** Match Payload’s default `auth.cookies.secure` (false unless you set it on the auth collection). */
  const secure =
    process.env.PAYLOAD_AUTH_COOKIE_SECURE === "true" ||
    process.env.PAYLOAD_AUTH_COOKIE_SECURE === "1";

  const jar = await cookies();
  const res = NextResponse.json({ ok: true });

  const names = new Set<string>([tokenName]);
  for (const c of jar.getAll()) {
    if (c.name.startsWith(prefix) && c.name.includes("token")) {
      names.add(c.name);
    }
  }

  for (const name of names) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure,
    });
  }

  return res;
}
