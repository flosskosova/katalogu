import type { Payload } from "payload";
import { SITE } from "@/lib/seo/site";
import {
  formatSmtpFromAddress,
  resolveSmtpSettings,
} from "./resolveSmtpSettings";

export type ToolSuggestionDoc = {
  id: string | number;
  appName?: string;
  repoUrl?: string;
  homepageUrl?: string;
  description?: string;
  license?: string;
  categoryHint?: string;
  additionalNotes?: string;
  submitterName?: string;
  submitterEmail?: string;
};

/**
 * Resolves recipients: `TOOL_SUGGESTION_NOTIFY_EMAIL` (comma-separated), else all admin users.
 */
export async function resolveSuggestionNotifyEmails(
  payload: Payload,
): Promise<string[]> {
  const raw = process.env.TOOL_SUGGESTION_NOTIFY_EMAIL?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const { docs } = await payload.find({
    collection: "users",
    where: { role: { equals: "admin" } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  const emails = docs
    .map((d) => (d as { email?: string }).email)
    .filter((e): e is string => typeof e === "string" && e.includes("@"));
  return [...new Set(emails)];
}

export async function sendToolSuggestionNotification(
  payload: Payload,
  doc: ToolSuggestionDoc,
  adminUrl: string,
): Promise<void> {
  const cfg = await resolveSmtpSettings(payload);
  if (!cfg) {
    payload.logger.info({
      msg: "[email] Tool suggestion saved but SMTP disabled — configure General Settings or SMTP_* env",
      suggestionId: doc.id,
    });
    return;
  }

  const to = await resolveSuggestionNotifyEmails(payload);
  if (to.length === 0) {
    payload.logger.warn({
      msg: "[email] No admin emails for tool suggestion notification — set TOOL_SUGGESTION_NOTIFY_EMAIL or ensure an admin user exists",
      suggestionId: doc.id,
    });
    return;
  }

  const subject = `[${SITE.name}] New tool suggestion: ${doc.appName ?? "(no name)"}`;
  const lines = [
    `A visitor submitted a FOSS app/tool suggestion.`,
    ``,
    `App name: ${doc.appName ?? ""}`,
    `Repository: ${doc.repoUrl ?? ""}`,
    doc.homepageUrl ? `Homepage: ${doc.homepageUrl}` : null,
    `Submitter: ${doc.submitterName ? `${doc.submitterName} <${doc.submitterEmail}>` : doc.submitterEmail ?? ""}`,
    doc.license ? `License: ${doc.license}` : null,
    doc.categoryHint ? `Category hint: ${doc.categoryHint}` : null,
    ``,
    `Description:`,
    doc.description ?? "",
    ``,
    doc.additionalNotes ? `Additional notes:\n${doc.additionalNotes}\n` : null,
    `---`,
    `Review in admin: ${adminUrl}`,
  ].filter((x) => x != null && x !== "");

  const text = lines.join("\n");

  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
  });

  await transport.sendMail({
    to,
    subject,
    text,
    from: formatSmtpFromAddress(cfg),
    replyTo: doc.submitterEmail,
  });
}
