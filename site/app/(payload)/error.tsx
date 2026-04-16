"use client";

/**
 * Payload / CMS subtree. Production omits the underlying message in the client bundle; use digest
 * + Vercel (or `next start`) server logs for the real error.
 */
export default function PayloadRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "40rem",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: "1.25rem" }}>CMS / admin could not render</h1>
      {error.digest ? (
        <p>
          Log reference: <code>{error.digest}</code> — search it in{" "}
          <strong>Vercel → Logs</strong> (same timestamp as this page load).
        </p>
      ) : null}
      <p style={{ color: "#555", fontSize: "0.9rem" }}>
        Check <code>DATABASE_URL</code> (Supabase session pooler on Vercel),{" "}
        <code>PAYLOAD_SECRET</code>, and <code>PAYLOAD_SERVER_URL</code> for your live domain, then
        redeploy.
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
    </div>
  );
}
