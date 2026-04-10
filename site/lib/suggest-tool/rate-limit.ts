import type { Payload } from "payload";

const MAX_PER_IP_24H = 5;
const MAX_PER_EMAIL_24H = 3;

function isWithin24h(createdAt: string | Date | undefined): boolean {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now() - 24 * 60 * 60 * 1000;
}

export async function assertSuggestionRateLimit(
  payload: Payload,
  ipHash: string,
  email: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { docs: ipDocs } = await payload.find({
    collection: "tool-suggestions",
    where: { submissionIpHash: { equals: ipHash } },
    limit: 50,
    sort: "-createdAt",
    depth: 0,
    overrideAccess: true,
  });
  const ipRecent = ipDocs.filter((d) =>
    isWithin24h((d as { createdAt?: string }).createdAt),
  ).length;
  if (ipRecent >= MAX_PER_IP_24H) {
    return {
      ok: false,
      reason:
        "Too many submissions from this network in the last 24 hours. Please try again later.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { docs: emailDocs } = await payload.find({
    collection: "tool-suggestions",
    where: { submitterEmail: { equals: normalizedEmail } },
    limit: 50,
    sort: "-createdAt",
    depth: 0,
    overrideAccess: true,
  });
  const emailRecent = emailDocs.filter((d) =>
    isWithin24h((d as { createdAt?: string }).createdAt),
  ).length;
  if (emailRecent >= MAX_PER_EMAIL_24H) {
    return {
      ok: false,
      reason:
        "Too many submissions for this email in the last 24 hours. Please try again later.",
    };
  }

  return { ok: true };
}
