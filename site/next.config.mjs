import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Ensures a single, correct client bundle for Payload admin (fixes `useConfig` undefined with Turbopack). */
  transpilePackages: [
    "@payloadcms/ui",
    "@payloadcms/next",
    "@payloadcms/richtext-lexical",
  ],
  // Payload ships server-only deps
  serverExternalPackages: [
    "@libsql/client",
    "@payloadcms/db-sqlite",
    "payload",
  ],
};

export default withPayload(nextConfig);
