import { withPayload } from "@payloadcms/next/withPayload";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self' https://challenges.cloudflare.com",
  "worker-src 'self' blob: https://challenges.cloudflare.com",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: ws: wss:",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

/** Payload admin loads many chunks/workers; CSP is easy to mis-tune here — keep other headers only. */
const securityHeadersAdmin = securityHeaders.filter(
  (h) => h.key !== "Content-Security-Policy",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /** Fewer parallel static workers → fewer concurrent Postgres sessions during build (Supabase pooler). */
    staticGenerationMaxConcurrency: 1,
  },
  // Payload ships server-only deps
  serverExternalPackages: [
    "@libsql/client",
    "@payloadcms/db-sqlite",
    "payload",
  ],
  async headers() {
    return [
      { source: "/admin", headers: securityHeadersAdmin },
      { source: "/admin/:path*", headers: securityHeadersAdmin },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withPayload(nextConfig);
