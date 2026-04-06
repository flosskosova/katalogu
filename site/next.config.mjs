import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Payload ships server-only deps
  serverExternalPackages: ["@payloadcms/db-sqlite", "payload"],
};

export default withPayload(nextConfig);
