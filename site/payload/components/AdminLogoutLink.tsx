"use client";

import Link from "next/link";

/**
 * Header action slot (`admin.components.actions`) — always visible next to the main admin chrome.
 */
export function AdminLogoutHeaderAction() {
  return (
    <Link
      href="/admin/logout"
      prefetch={false}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "13px",
        fontWeight: 500,
        padding: "6px 12px",
        borderRadius: "4px",
        border: "1px solid var(--theme-elevation-150, #e5e5e5)",
        color: "var(--theme-text, #333)",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      Log out
    </Link>
  );
}

/**
 * Replaces Payload’s sidebar logout control (`admin.components.logout.Button`).
 * Uses the built-in `/admin/logout` route so cookies/session clear reliably.
 */
export function AdminLogoutButton() {
  return (
    <Link
      href="/admin/logout"
      prefetch={false}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--theme-error-600, #b42318)",
        textDecoration: "none",
        borderRadius: "4px",
        border: "1px solid var(--theme-elevation-150, #e5e5e5)",
        background: "var(--theme-elevation-50, #fafafa)",
      }}
    >
      Log out
    </Link>
  );
}
