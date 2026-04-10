import type { Payload } from "payload";

export type ResolvedSmtp = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

function trim(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Loads SMTP from General Settings global, with env fallbacks for CI / local `.env`.
 * Uses `overrideAccess` so forgot-password works without a logged-in user.
 */
export async function resolveSmtpSettings(
  payload: Payload,
): Promise<ResolvedSmtp | null> {
  const envHost = process.env.SMTP_HOST?.trim();
  const envPort = Number(process.env.SMTP_PORT || "0") || 0;
  const envUser = process.env.SMTP_USER?.trim();
  const envPass = process.env.SMTP_PASS?.trim();
  const envSecure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1";
  const envFromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  const envFromName = process.env.SMTP_FROM_NAME?.trim();

  let doc: Record<string, unknown> | null = null;
  try {
    const g = await payload.findGlobal({
      slug: "general-settings",
      depth: 0,
      overrideAccess: true,
    });
    doc = g as unknown as Record<string, unknown> | null;
  } catch {
    doc = null;
  }

  const enabledByGlobal = Boolean(doc?.smtpEnabled);
  const enabledByEnv = Boolean(envHost && envUser && envPass);
  if (!enabledByGlobal && !enabledByEnv) return null;

  const user = trim(doc?.smtpUser) || envUser || "";
  const password = trim(doc?.smtpPassword) || envPass || "";
  if (!user || !password) return null;

  const host = trim(doc?.smtpHost) || envHost || "smtp.gmail.com";
  const portRaw = doc?.smtpPort;
  const port =
    typeof portRaw === "number" && Number.isFinite(portRaw)
      ? portRaw
      : envPort || 587;

  const secure =
    typeof doc?.smtpSecure === "boolean" ? doc.smtpSecure : envSecure;

  /** “From email” / “From name” in Settings → General Settings, else SMTP_* env, else login user. */
  const fromEmail = trim(doc?.smtpFromEmail) || envFromEmail || user;
  const fromName = trim(doc?.smtpFromName) || envFromName || "OpenCatalog";

  return {
    enabled: true,
    host,
    port,
    secure,
    user,
    password,
    fromEmail,
    fromName,
  };
}

/** RFC5322 From header for nodemailer — always use resolved SMTP identity (not a bare env default). */
export function formatSmtpFromAddress(cfg: ResolvedSmtp): string {
  return `"${cfg.fromName}" <${cfg.fromEmail}>`;
}
