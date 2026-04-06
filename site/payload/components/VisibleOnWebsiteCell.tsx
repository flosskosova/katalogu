"use client";

import { useConfig } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type RowData = {
  id?: string | number;
  _id?: string | number;
};

type Props = {
  cellData?: boolean | null;
  collectionSlug: string;
  rowData: RowData;
  viewType?: "list" | "trash" | string;
};

/** List column: click toggles public visibility (PATCH + refresh). */
export function VisibleOnWebsiteCell({
  cellData,
  collectionSlug,
  rowData,
  viewType,
}: Props) {
  const { config } = useConfig();
  const router = useRouter();
  const docId = rowData.id ?? rowData._id;

  const [visible, setVisible] = useState(cellData !== false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setVisible(cellData !== false);
  }, [cellData]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pending || docId == null || viewType === "trash") return;

      const nextVisible = !visible;
      setPending(true);
      setVisible(nextVisible);

      try {
        const url = formatAdminURL({
          apiRoute: config.routes.api,
          path: `/${collectionSlug}/${encodeURIComponent(String(docId))}`,
        });
        const res = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibleOnWebsite: nextVisible }),
        });
        if (!res.ok) {
          let message = res.statusText;
          try {
            const body = (await res.json()) as {
              message?: string;
              errors?: { message?: string }[];
            };
            message =
              body?.message ??
              body?.errors?.[0]?.message ??
              message;
          } catch {
            /* ignore */
          }
          throw new Error(message);
        }
        router.refresh();
      } catch (err) {
        setVisible(!nextVisible);
        toast.error(
          err instanceof Error ? err.message : "Could not update visibility",
        );
      } finally {
        setPending(false);
      }
    },
    [
      visible,
      pending,
      docId,
      collectionSlug,
      viewType,
      config.routes.api,
      router,
    ],
  );

  const kindNoun =
    collectionSlug === "catalog-categories"
      ? "This category"
      : collectionSlug === "catalog-tools"
        ? "This tool"
        : "This entry";

  const title = visible
    ? `${kindNoun} is shown on the live website: browse pages, search, category and tool lists, top picks, and curated blocks where it applies. It stays published in the CMS; draft preview can still show it. Click to hide it from visitors.`
    : `${kindNoun} is hidden on the live website (browse, search, lists, and those blocks). It can remain published here for editors; use draft preview to review. Click to show it on the website again.`;

  const ariaLabel = visible
    ? `${kindNoun} visible on live site. Click to hide from website.`
    : `${kindNoun} hidden from live site. Click to show on website.`;

  const color = visible
    ? "var(--theme-elevation-1000, #111)"
    : "var(--theme-elevation-500, #94a3b8)";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || docId == null || viewType === "trash"}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={visible}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        margin: 0,
        border: "none",
        background: "transparent",
        cursor: pending ? "wait" : "pointer",
        color,
        borderRadius: 4,
        lineHeight: 0,
      }}
    >
      {visible ? (
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
          <path d="M14.084 14.158a3 3 0 0 1-4.121-4.121" />
          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
          <path d="m2 2 20 20" />
        </svg>
      )}
    </button>
  );
}
