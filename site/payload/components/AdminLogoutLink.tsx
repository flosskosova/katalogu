"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";
import { useCallback, useState } from "react";

/**
 * Clears client auth, POSTs logout (always, using admin user slug) so Set-Cookie expires the token,
 * then hard-navigates to login. Payload’s built-in `logOut()` skips the request when `user` is missing
 * even if the cookie is still present.
 */
export async function performAdminLogout(args: {
  apiRoute: string;
  adminRoute: string;
  userSlug: string;
  loginRoute: string;
  setUser: (user: null) => void;
}): Promise<void> {
  const { apiRoute, adminRoute, userSlug, loginRoute, setUser } = args;
  try {
    setUser(null);
  } catch {
    /* continue */
  }

  const logoutURL = formatAdminURL({
    apiRoute,
    path: `/${userSlug}/logout` as `/${string}`,
  });
  try {
    await fetch(logoutURL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    /* still redirect */
  }

  const path = (
    loginRoute.startsWith("/") ? loginRoute : `/${loginRoute}`
  ) as `/${string}`;
  const loginURL = formatAdminURL({ adminRoute, path });
  window.location.replace(loginURL);
}

/**
 * Header action slot (`admin.components.actions`).
 */
export function AdminLogoutHeaderAction() {
  const { logOut, setUser } = useAuth();
  const { config } = useConfig();
  const [busy, setBusy] = useState(false);
  const onClick = useCallback(() => {
    if (busy) return;
    setBusy(true);
    const apiRoute = config.routes.api;
    const adminRoute = config.routes.admin;
    const userSlug = config.admin.user;
    const loginRoute = config.admin.routes.login;

    void (async () => {
      try {
        await logOut();
      } catch {
        /* performAdminLogout still clears cookie */
      }
      await performAdminLogout({
        apiRoute,
        adminRoute,
        userSlug,
        loginRoute,
        setUser,
      });
    })();
  }, [busy, config, logOut, setUser]);

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
  const { logOut, setUser } = useAuth();
  const { config } = useConfig();
  const [busy, setBusy] = useState(false);
  const onClick = useCallback(() => {
    if (busy) return;
    setBusy(true);
    const apiRoute = config.routes.api;
    const adminRoute = config.routes.admin;
    const userSlug = config.admin.user;
    const loginRoute = config.admin.routes.login;

    void (async () => {
      try {
        await logOut();
      } catch {
        /* performAdminLogout still clears cookie */
      }
      await performAdminLogout({
        apiRoute,
        adminRoute,
        userSlug,
        loginRoute,
        setUser,
      });
    })();
  }, [busy, config, logOut, setUser]);

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
