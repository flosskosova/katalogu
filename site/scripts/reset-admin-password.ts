/**
 * Set a new password for an existing user (e.g. admin) via the Local API.
 * Does not commit secrets — pass credentials only via environment or shell (not in git).
 *
 * From `site/`:
 *   ADMIN_EMAIL=you@example.com ADMIN_NEW_PASSWORD='your-long-secret' npx --yes jiti scripts/reset-admin-password.ts
 *
 * Or add to `.env` temporarily, run, then remove:
 *   npm run admin:reset-password
 */
import path from "node:path";
import type { SanitizedConfig } from "payload";
import { createJiti } from "jiti";

async function loadPayloadConfig(): Promise<SanitizedConfig> {
  const siteRoot = process.cwd();
  const jiti = createJiti(import.meta.url, {
    alias: { "@": siteRoot },
  });
  const mod = (await jiti.import(path.join(siteRoot, "payload.config.ts"))) as {
    default: SanitizedConfig;
  };
  return mod.default;
}

async function main() {
  const email =
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.SEED_ADMIN_EMAIL?.trim() ||
    "";
  const newPassword = process.env.ADMIN_NEW_PASSWORD?.trim() || "";

  if (!email) {
    console.error(
      "Set ADMIN_EMAIL (or SEED_ADMIN_EMAIL) to the account’s email address.",
    );
    process.exit(1);
  }
  if (!newPassword || newPassword.length < 8) {
    console.error(
      "Set ADMIN_NEW_PASSWORD to a new password (at least 8 characters).",
    );
    process.exit(1);
  }

  process.env.PAYLOAD_MIGRATING = "true";
  process.env.DISABLE_PAYLOAD_HMR = "true";

  const { getPayload } = await import("payload");
  const config = await loadPayloadConfig();
  const payload = await getPayload({ config });

  const found = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  const doc = found.docs[0];
  if (!doc) {
    console.error(`No user found with email: ${email}`);
    await payload.destroy();
    process.exit(1);
  }

  const id = doc.id as string | number;

  await payload.update({
    collection: "users",
    id,
    data: {
      password: newPassword,
      confirmPassword: newPassword,
      /** Ensure you can open /admin after reset (optional safety). */
      role: "admin",
    },
    overrideAccess: true,
  });

  console.log(`Password updated for ${email} (role set to admin).`);
  await payload.destroy();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
