import { createHash } from "node:crypto";

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

export function hashIpForRateLimit(ip: string, secret: string): string {
  return createHash("sha256").update(`${ip}:${secret}`).digest("hex");
}
