"use client";

/**
 * Catches render failures in the **root** `app/layout.tsx` (and other errors that skip nested
 * `error.tsx`). Production builds omit the real message in the browser; the digest matches Vercel
 * / server logs for the same request.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          maxWidth: "40rem",
          lineHeight: 1.5,
        }}
      >
        <h1 style={{ fontSize: "1.25rem" }}>This page could not be loaded</h1>
        {error.digest ? (
          <p>
            Log reference: <code>{error.digest}</code> — in Vercel open{" "}
            <strong>Logs</strong> and search this digest (or filter errors around the same time) to
            see the real stack trace.
          </p>
        ) : (
          <p>
            Open your host&apos;s function logs for the failing request; the browser hides the
            detailed error in production.
          </p>
        )}
        <p style={{ color: "#555", fontSize: "0.9rem" }}>
          For Payload <code>/admin</code>: check <code>NEXT_PUBLIC_SITE_URL</code>,{" "}
          <code>DATABASE_URL</code> (Supabase session pooler on Vercel), and migrations. Postgres TLS
          errors: ensure latest deploy; non-Supabase DBs may need{" "}
          <code>PAYLOAD_POSTGRES_TLS_INSECURE=1</code>.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
