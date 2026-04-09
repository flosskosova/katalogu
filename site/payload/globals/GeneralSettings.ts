import type { GlobalConfig } from "payload";
import { adminOnlyAccess } from "../access";

/**
 * Admin-only SMTP (e.g. Gmail with an App Password) for forgot-password and other emails.
 * Server code reads this with `overrideAccess` when sending mail (unauthenticated flows).
 */
export const GeneralSettings: GlobalConfig = {
  slug: "general-settings",
  label: "General Settings",
  admin: {
    group: "Settings",
    description:
      "Configure outgoing email. For Gmail: use an App Password (Google Account → Security → 2-Step Verification → App passwords), not your normal login password.",
  },
  access: {
    read: adminOnlyAccess,
    update: adminOnlyAccess,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Email (SMTP)",
          fields: [
            {
              name: "smtpEnabled",
              type: "checkbox",
              label: "Enable SMTP",
              defaultValue: false,
              admin: {
                description:
                  "When off, emails are only logged to the server console (good for local dev).",
              },
            },
            {
              name: "smtpHost",
              type: "text",
              label: "SMTP host",
              defaultValue: "smtp.gmail.com",
            },
            {
              name: "smtpPort",
              type: "number",
              label: "SMTP port",
              defaultValue: 587,
              admin: {
                description: "587 = STARTTLS (recommended for Gmail). 465 = implicit SSL.",
              },
            },
            {
              name: "smtpSecure",
              type: "checkbox",
              label: "Use TLS (SSL)",
              defaultValue: false,
              admin: {
                description:
                  "Enable for port 465. For Gmail on 587, leave unchecked (STARTTLS is negotiated automatically).",
              },
            },
            {
              name: "smtpUser",
              type: "text",
              label: "SMTP username",
              admin: {
                description: "Usually your full Gmail address.",
                placeholder: "you@gmail.com",
              },
            },
            {
              name: "smtpPassword",
              type: "text",
              label: "SMTP password / App Password",
              admin: {
                description:
                  "Gmail: create a 16-character App Password. Stored in the database — keep admin access restricted.",
                placeholder: "xxxx xxxx xxxx xxxx",
              },
            },
            {
              name: "smtpFromEmail",
              type: "text",
              label: "From email",
              admin: {
                description: "Defaults to SMTP username if empty.",
                placeholder: "you@gmail.com",
              },
            },
            {
              name: "smtpFromName",
              type: "text",
              label: "From name",
              admin: {
                placeholder: "OpenCatalog",
              },
            },
          ],
        },
      ],
    },
  ],
};
