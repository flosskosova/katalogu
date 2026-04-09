"use client";

import { useCallback, useState } from "react";

/** Must match `Users.slug` in `payload/collections/Users.ts` (avoid importing server config in client). */
const USERS_COLLECTION_SLUG = "users";

/**
 * Calls Payload’s REST logout so `Set-Cookie` clears the httpOnly token, then hard-navigates.
 * Client `Link` / soft navigation to `/admin/logout` can show “logged out” without reliably clearing cookies.
 */
export async function performAdminLogout(): Promise<void> {
  try {
    await fetch(`/api/${USERS_COLLECTION_SLUG}/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    /* still redirect */
  }
  window.location.replace("/admin/login");
}

/**
 * Header action slot (`admin.components.actions`).
 */
export function AdminLogoutHeaderAction() {
  const [busy, setBusy] = useState(false);
  const onClick = useCallback(() => {
    if (busy) return;
    setBusy(true);
    void performAdminLogout();
  }, [busy]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "13px",
        fontWeight: 500,
        padding: "6px 12px",
        borderRadius: "4px",
        border: "1px solid var(--theme-elevation-150, #e5e5e5)",
        color: "var(--theme-text, #333)",
        background: "var(--theme-bg, #fff)",
        cursor: busy ? "wait" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}

/**
 * Sidebar logout (`admin.components.logout.Button`).
 */
export function AdminLogoutButton() {
  const [busy, setBusy] = useState(false);
  const onClick = useCallback(() => {
    if (busy) return;
    setBusy(true);
    void performAdminLogout();
  }, [busy]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
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
        cursor: busy ? "wait" : "pointer",
      }}
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
