"use client";

import type { BeforeListClientProps, ListViewClientProps } from "payload";

import { Button, DefaultListView } from "@payloadcms/ui";
import { useEffect, useState } from "react";

/** Must match `Users.slug`. */
const USERS_COLLECTION_SLUG = "users";

/**
 * Hides Payload’s default “Create new” control; admins use {@link UsersAddStaffButton} instead
 * so the entry point does not depend on permission resolution quirks for auth collections.
 */
export function UsersListView(props: ListViewClientProps) {
  return <DefaultListView {...props} hasCreatePermission={false} />;
}

/**
 * Shown only when `GET /api/users/me` returns `role: admin` (loads from DB, not stale JWT alone).
 */
export function UsersAddStaffButton({
  newDocumentURL,
}: BeforeListClientProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(`/api/${USERS_COLLECTION_SLUG}/me`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok || canceled) return;
        const data = (await res.json()) as { user?: { role?: string } };
        if (!canceled) setIsAdmin(data.user?.role === "admin");
      } catch {
        if (!canceled) setIsAdmin(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  if (isAdmin !== true) return null;

  return (
    <div
      className="users-add-staff-banner"
      style={{ marginBottom: "1.25rem" }}
    >
      <Button
        buttonStyle="primary"
        icon={["plus"]}
        onClick={() => {
          window.location.assign(newDocumentURL);
        }}
        size="small"
        type="button"
      >
        Add staff user
      </Button>
    </div>
  );
}
