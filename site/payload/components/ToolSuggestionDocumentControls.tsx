"use client";

import { Button, toast, useDocumentInfo } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  const id = info.id;
  const slug = info.collectionSlug ?? info.docConfig?.slug;
  const data = info.data;
  const hasDelete = info.hasDeletePermission === true;

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
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/${COLLECTION}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const raw = await res.text();
      let errMsg = res.ok ? "" : `HTTP ${res.status}`;
      try {
        const j = raw ? JSON.parse(raw) : {};
        if (!res.ok) {
          const first =
            Array.isArray(j?.errors) && j.errors[0] && typeof j.errors[0].message === "string"
              ? j.errors[0].message
              : undefined;
          errMsg = first ?? (typeof j?.message === "string" ? j.message : errMsg);
        }
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        throw new Error(errMsg || "Update failed");
      }
    },
    [id],
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
    try {
      await patch({
        status: "accepted",
        reviewedCategory: Number(cat),
        reviewNote: noteMerged || undefined,
      });
      toast.success("Marked as accepted.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept.");
    } finally {
      setBusy(null);
    }
  }, [categoryId, data?.reviewedCategory, id, patch, reviewNote, router]);

  const onDecline = useCallback(async () => {
    if (id == null) return;
    const noteMerged = reviewNote.trim();
    setBusy("decline");
    try {
      await patch({
        status: "rejected",
        reviewNote: noteMerged || undefined,
      });
      toast.success("Marked as declined.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not decline.");
    } finally {
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
      const res = await fetch(`/api/${COLLECTION}/${id}`, {
        method: "DELETE",
        credentials: "include",
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
      router.replace(`/admin/collections/${COLLECTION}`);
      router.refresh();
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
  }, [id, router]);

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
        ) : null}
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
