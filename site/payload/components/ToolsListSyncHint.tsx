"use client";

import React from "react";

/**
 * Shown above the Tools list — explains why site-only entries don't appear in search.
 */
export function ToolsListSyncHint() {
  return (
    <div
      style={{
        marginBottom: "1rem",
        padding: "12px 14px",
        borderRadius: 8,
        background: "var(--theme-elevation-50, #f8fafc)",
        border: "1px solid var(--theme-elevation-150, #e2e8f0)",
        fontSize: 13,
        lineHeight: 1.5,
        color: "var(--theme-text, #334155)",
      }}
    >
      <strong style={{ display: "block", marginBottom: 6 }}>
        Search only finds tools stored here
      </strong>
      The public site can still show entries from static <code>data/tools</code> until they are
      imported. If something (e.g. Matomo) is on the site but not here, open a terminal in the{" "}
      <code>site</code> folder and run{" "}
      <code style={{ userSelect: "all" }}>npm run catalog:sync</code>
      — use the same <code>.env</code> / <code>DATABASE_URL</code> as this app, then refresh and
      search again.
    </div>
  );
}
