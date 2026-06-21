"use client";

import {
  Button,
  toast,
  useDocumentInfo,
  useRouteCache,
  useTranslation,
} from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const COLLECTION = "tool-suggestions";

function relationshipId(val: unknown): string | number | null {
  if (val == null) return null;
  if (typeof val === "number" || typeof val === "string") return val;
  if (typeof val === "object" && val !== null && "id" in val) {
    const id = (val as { id: unknown }).id;
    if (typeof id === "number" || typeof id === "string") return id;
  }
  return null;
}

/**
 * Toolbar for Accept / Decline / Delete. Does **not** use `useFormFields` — that hook only works
 * inside Payload’s document `<Form>` tree, while `beforeDocumentControls` renders outside it and
 * would throw, blanking the admin UI.
 */
export function ToolSuggestionDocumentControls() {
  const router = useRouter();
  const info = useDocumentInfo();
  const { i18n } = useTranslation();
  const { clearRouteCache } = useRouteCache();
  const id = info.id;
  const slug = info.collectionSlug ?? info.docConfig?.slug;
  const data = info.data;
  const hasDelete = info.hasDeletePermission === true;

  /** Same headers Payload’s list/bulk delete uses for REST (see DeleteMany in @payloadcms/ui). */
  const restHeaders = useMemo(
    () => ({
      "Accept-Language": i18n.language,
      "Content-Type": "application/json",
    }),
    [i18n.language],
  );

  /** Same URL Payload uses for this document (locale, depth, etc. in query — see DocumentInfo `action`). */
  const documentUrl = useMemo(() => {
    if (typeof info.action === "string" && info.action.length > 0) {
      return info.action;
    }
    return `/api/${COLLECTION}/${encodeURIComponent(String(id ?? ""))}`;
  }, [info.action, id]);

  const [categoryId, setCategoryId] = useState<string>("");
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState<null | "accept" | "decline" | "delete">(null);

  useEffect(() => {
    const rid = relationshipId(data?.reviewedCategory);
    setCategoryId(rid != null ? String(rid) : "");
    const note = data?.reviewNote;
    setReviewNote(typeof note === "string" ? note : "");
  }, [data?.reviewedCategory, data?.reviewNote]);

  const patch = useCallback(
    async (body: Record<string, unknown>, signal?: AbortSignal) => {
      const res = await fetch(documentUrl, {
        method: "PATCH",
        headers: restHeaders,
        credentials: "include",
        body: JSON.stringify(body),
        signal,
      });
      const raw = await res.text();
      let errMsg = res.ok ? "" : `HTTP ${res.status}`;
      let parsed: Record<string, unknown> = {};
      try {
        parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        if (!res.ok) {
          const first =
            Array.isArray(parsed?.errors) &&
            parsed.errors[0] &&
            typeof (parsed.errors[0] as { message?: string }).message === "string"
              ? (parsed.errors[0] as { message: string }).message
              : undefined;
          errMsg = first ?? (typeof parsed?.message === "string" ? parsed.message : errMsg);
        }
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        throw new Error(errMsg || "Update failed");
      }
      return parsed;
    },
    [documentUrl, restHeaders],
  );

  const onAccept = useCallback(async () => {
    if (id == null) return;
    const fromSelect = categoryId.trim() ? Number(categoryId) : null;
    const fromDoc = relationshipId(data?.reviewedCategory);
    const cat =
      fromSelect != null && !Number.isNaN(fromSelect) ? fromSelect : fromDoc != null ? Number(fromDoc) : null;
    if (cat == null || Number.isNaN(Number(cat))) {
      toast.error("Choose a suggested catalog category (toolbar or sidebar) before accepting.");
      return;
    }
    const noteMerged = reviewNote.trim();
    setBusy("accept");
    const ac = new AbortController();
    const t = window.setTimeout(() => ac.abort(), 120_000);
    try {
      const res = await fetch("/api/accept-tool-suggestion", {
        method: "POST",
        headers: restHeaders,
        credentials: "include",
        body: JSON.stringify({
          suggestionId: id,
          reviewedCategory: Number(cat),
          reviewNote: noteMerged || undefined,
        }),
        signal: ac.signal,
      });
      const raw = await res.text();
      let parsed: Record<string, unknown> = {};
      try {
        parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        const errMsg =
          typeof parsed?.error === "string"
            ? parsed.error
            : `HTTP ${res.status}`;
        throw new Error(errMsg);
      }
      const slug =
        typeof parsed.toolSlug === "string" && parsed.toolSlug
          ? parsed.toolSlug
          : null;
      toast.success(
        typeof parsed.message === "string"
          ? parsed.message
          : slug
            ? `Created catalog tool “${slug}” in the selected category.`
            : "Accepted — catalog tool created.",
      );
      clearRouteCache();
      window.location.assign(`/admin/collections/${COLLECTION}`);
    } catch (e) {
      if (ac.signal.aborted) {
        toast.error(
          "Accept timed out (120s). Redeploy after fixing Postgres pool — Vercel needs pool max ≥ 2 for admin saves.",
        );
      } else {
        toast.error(e instanceof Error ? e.message : "Could not accept.");
      }
    } finally {
      window.clearTimeout(t);
      setBusy(null);
    }
  }, [categoryId, clearRouteCache, data?.reviewedCategory, id, restHeaders, reviewNote]);

  const onDecline = useCallback(async () => {
    if (id == null) return;
    const noteMerged = reviewNote.trim();
    setBusy("decline");
    const ac = new AbortController();
    const t = window.setTimeout(() => ac.abort(), 120_000);
    try {
      await patch(
        {
          status: "rejected",
          reviewNote: noteMerged || undefined,
        },
        ac.signal,
      );
      toast.success("Marked as declined.");
      router.refresh();
    } catch (e) {
      if (ac.signal.aborted) {
        toast.error("Decline timed out (120s). Check Vercel logs and Postgres pool settings.");
      } else {
        toast.error(e instanceof Error ? e.message : "Could not decline.");
      }
    } finally {
      window.clearTimeout(t);
      setBusy(null);
    }
  }, [id, patch, reviewNote, router]);

  const onDelete = useCallback(async () => {
    if (id == null) return;
    if (!window.confirm("Permanently delete this suggestion? This cannot be undone.")) {
      return;
    }
    setBusy("delete");
    const ac = new AbortController();
    const t = window.setTimeout(() => ac.abort(), 120_000);
    try {
      const res = await fetch(documentUrl, {
        method: "DELETE",
        credentials: "include",
        headers: restHeaders,
        signal: ac.signal,
      });
      const raw = await res.text();
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const j = raw ? JSON.parse(raw) : {};
          const first =
            Array.isArray(j?.errors) && j.errors[0] && typeof j.errors[0].message === "string"
              ? j.errors[0].message
              : undefined;
          errMsg = first ?? (typeof j?.message === "string" ? j.message : errMsg);
        } catch {
          if (raw) errMsg = raw.slice(0, 500);
        }
        throw new Error(errMsg);
      }
      toast.success("Suggestion deleted.");
      clearRouteCache();
      window.location.assign(`/admin/collections/${COLLECTION}`);
    } catch (e) {
      if (ac.signal.aborted) {
        toast.error(
          "Delete timed out (120s). If this persists after redeploy, check Vercel logs — often Postgres pool or DB connectivity.",
        );
      } else {
        toast.error(e instanceof Error ? e.message : "Could not delete.");
      }
    } finally {
      window.clearTimeout(t);
      setBusy(null);
    }
  }, [clearRouteCache, documentUrl, id, restHeaders]);

  if (slug !== COLLECTION || id == null) {
    return null;
  }

  return (
    <div
      className="tool-suggestion-controls"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: "0.75rem",
        marginBottom: "0.5rem",
        padding: "0.75rem 0",
        borderBottom: "1px solid var(--theme-elevation-100)",
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "14rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Suggested catalog category</span>
        <CategorySelect value={categoryId} onChange={setCategoryId} disabled={Boolean(busy)} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: "1 1 12rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Review note (optional)</span>
        <input
          type="text"
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          disabled={Boolean(busy)}
          placeholder="Internal note — why accept/decline"
          style={{
            padding: "0.4rem 0.5rem",
            borderRadius: "var(--style-radius-s)",
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-input-bg)",
            color: "var(--theme-elevation-1000)",
          }}
        />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <Button
          type="button"
          buttonStyle="primary"
          size="small"
          disabled={Boolean(busy)}
          onClick={onAccept}
        >
          {busy === "accept" ? "Accepting…" : "Accept"}
        </Button>
        <Button
          type="button"
          buttonStyle="secondary"
          size="small"
          disabled={Boolean(busy)}
          onClick={onDecline}
        >
          {busy === "decline" ? "Declining…" : "Decline"}
        </Button>
        {hasDelete ? (
          <Button
            type="button"
            buttonStyle="error"
            size="small"
            disabled={Boolean(busy)}
            onClick={onDelete}
          >
            {busy === "delete" ? "Deleting…" : "Delete"}
          </Button>
        ) : (
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--theme-elevation-600)",
              maxWidth: "14rem",
            }}
            title="Your account needs editor or admin role to delete."
          >
            Delete unavailable — sign in as an editor or admin.
          </span>
        )}
      </div>
    </div>
  );
}

function CategorySelect(props: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch("/api/catalog-categories?limit=500&depth=0", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as {
          docs?: { id?: number | string; name?: string }[];
        };
        const opts =
          json.docs?.map((d) => ({
            id: String(d.id ?? ""),
            label: typeof d.name === "string" ? d.name : String(d.id ?? ""),
          })) ?? [];
        if (!canceled) setOptions(opts);
      } catch {
        if (!canceled) setOptions([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      disabled={props.disabled || loading}
      style={{
        padding: "0.45rem 0.5rem",
        borderRadius: "var(--style-radius-s)",
        border: "1px solid var(--theme-elevation-150)",
        background: "var(--theme-input-bg)",
        color: "var(--theme-elevation-1000)",
        minWidth: "12rem",
      }}
    >
      <option value="">{loading ? "Loading categories…" : "— Select category —"}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
