"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TURNSTILE_TEST_SITE_KEY } from "@/lib/suggest-tool/turnstile-public";

export type SuggestToolFormProps = {
  /** From the Server Component page — must match `TURNSTILE_SECRET_*` used by `/api/suggest-tool`. */
  siteKey: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

const labelClass = "block text-sm font-medium text-[var(--foreground)]";

/** Cloudflare Turnstile `error-callback` may pass a numeric code or string (e.g. `"110200"`). */
function parseTurnstileErrorCode(code: unknown): number | undefined {
  if (typeof code === "number" && Number.isFinite(code)) return code;
  if (typeof code === "string") {
    const t = code.trim();
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function turnstileErrorUserMessage(code: unknown): string {
  const n = parseTurnstileErrorCode(code);
  const host =
    typeof window !== "undefined" ? window.location.hostname : "this site";

  if (n === 110200) {
    return `Verification does not allow this address (${host}). In Cloudflare Turnstile → your widget → Hostname Management, add this exact hostname. Note: www and non-www are separate entries.`;
  }
  if (n === 110100 || n === 110110) {
    return "Verification configuration looks wrong (site key). Please contact the site admin.";
  }
  /** Cloudflare: 400020 = widget/site key config (often wrong env key or hostname not allowlisted). */
  if (n === 400020) {
    return `Verification could not start (400020). Admins: copy the site key and secret from the same Turnstile widget in Cloudflare into Vercel (Build and Runtime), redeploy, and confirm Hostname Management lists this exact host: ${host} (add www separately if you use it). Others: refresh or try another browser.`;
  }
  if (n === 400070) {
    return "This verification widget is disabled in Cloudflare. Please contact the site admin.";
  }
  if (n != null && n >= 110000 && n < 120000) {
    return `Verification failed (code ${String(n)}). If this keeps happening, try another browser or contact the site admin.`;
  }
  if (
    n != null &&
    ((n >= 300000 && n < 400000) || (n >= 600000 && n < 700000))
  ) {
    return "Verification had a problem. Try refreshing the page, or disable extensions that block security challenges.";
  }
  if (n != null && n >= 400000 && n < 500000) {
    return `Verification failed (code ${String(n)}). Check Turnstile site key and hostname allowlist in Cloudflare, then refresh.`;
  }
  return n != null
    ? `Verification failed (code ${String(n)}). Please refresh and try again.`
    : "Verification failed to load. Please refresh the page.";
}

function describeSubmitFailure(err: unknown): string {
  if (err instanceof TypeError) {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === "string" && err.trim()) {
    return err;
  }
  const o = err as { message?: unknown };
  if (o && typeof o === "object" && typeof o.message === "string" && o.message.trim()) {
    return o.message;
  }
  return "Something went wrong while sending your suggestion. Please try again.";
}

export function SuggestToolForm({ siteKey }: SuggestToolFormProps) {
  const formId = useId();
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  /** Remount Turnstile after a failed verify so "Success" matches a fresh token. */
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  /** Shown under the widget when Turnstile errors (e.g. hostname not in Cloudflare allowlist). */
  const [turnstileHint, setTurnstileHint] = useState<string | null>(null);

  /**
   * Turnstile sometimes fills the widget token before `onSuccess` runs (e.g. slow iframe,
   * automation/Selenium). Poll `getResponse()` briefly so the submit button enables when a token
   * exists even if the callback was missed.
   */
  useEffect(() => {
    if (!siteKey || turnstileToken) return;
    let cancelled = false;
    const interval = window.setInterval(() => {
      if (cancelled) return;
      const r = turnstileRef.current?.getResponse?.()?.trim();
      if (r) {
        setTurnstileToken(r);
        setMessage(null);
        setTurnstileHint(null);
        setStatus((s) => (s === "error" ? "idle" : s));
        window.clearInterval(interval);
      }
    }, 300);
    const maxWait = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(maxWait);
    };
  }, [siteKey, turnstileKey, turnstileToken]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage(null);

      /** Capture before any `await` — async handlers must not rely on `e.currentTarget` later. */
      const form = e.currentTarget;

      if (!siteKey) {
        setStatus("error");
        setMessage(
          "Suggestions are temporarily unavailable. Please try again later.",
        );
        return;
      }

      const tokenFromWidget = turnstileRef.current?.getResponse?.()?.trim() ?? "";
      const token = tokenFromWidget || (turnstileToken ?? "").trim();
      if (!token) {
        setStatus("error");
        setMessage("Please complete the verification below.");
        return;
      }

      const fd = new FormData(form);
      const company = String(fd.get("company") ?? "");
      if (company.trim() !== "") {
        setStatus("success");
        return;
      }

      const payload = {
        appName: String(fd.get("appName") ?? "").trim(),
        repoUrl: String(fd.get("repoUrl") ?? "").trim(),
        homepageUrl: String(fd.get("homepageUrl") ?? "").trim(),
        description: String(fd.get("description") ?? "").trim(),
        license: String(fd.get("license") ?? "").trim(),
        categoryHint: String(fd.get("categoryHint") ?? "").trim(),
        additionalNotes: String(fd.get("additionalNotes") ?? "").trim(),
        submitterName: String(fd.get("submitterName") ?? "").trim(),
        submitterEmail: String(fd.get("submitterEmail") ?? "").trim(),
        company: "",
        turnstileToken: token,
      };

      setStatus("submitting");
      try {
        const apiUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/api/suggest-tool`
            : "/api/suggest-tool";
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });

        const raw = await res.text();
        let data: { ok?: boolean; error?: string } = {};
        try {
          data = raw ? (JSON.parse(raw) as { ok?: boolean; error?: string }) : {};
        } catch {
          setStatus("error");
          setMessage(
            res.ok
              ? "Unexpected server response. Please try again."
              : `Server error (${res.status}). If the problem continues, contact the site admin.`,
          );
          return;
        }

        if (!res.ok) {
          setStatus("error");
          setMessage(
            data.error ??
              (res.status === 429
                ? "Too many submissions. Please try again later."
                : "Something went wrong. Please try again."),
          );
          if (
            data.error?.includes("CAPTCHA") ||
            data.error?.includes("Verification")
          ) {
            setTurnstileToken(null);
            setTurnstileHint(null);
            setTurnstileKey((k) => k + 1);
          }
          return;
        }

        if (data.ok) {
          setStatus("success");
          form.reset();
          setTurnstileToken(null);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Something went wrong.");
        }
      } catch (err) {
        setStatus("error");
        console.error("[SuggestToolForm] submit error", err);
        const msg = describeSubmitFailure(err);
        setMessage(msg);
      }
    },
    [turnstileToken, siteKey],
  );

  if (status === "success") {
    return (
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-6 text-[var(--foreground)]"
        role="status"
      >
        <p className="font-medium text-[var(--foreground)]">
          Thank you — your suggestion was submitted.
        </p>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Editors will review it. If we need more detail, we may contact you by email.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => {
            setStatus("idle");
            setMessage(null);
          }}
        >
          Suggest another
        </Button>
      </div>
    );
  }

  return (
    <form
      id={formId}
      className="relative space-y-6"
      onSubmit={onSubmit}
      noValidate
    >
      {/* Honeypot — leave empty (bots often fill hidden fields) */}
      <div
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
        aria-hidden
      >
        <label htmlFor={`${formId}-company`}>Company</label>
        <input
          id={`${formId}-company`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-appName`}>
          App / tool name <span className="text-[var(--foreground-muted)]">*</span>
        </label>
        <input
          id={`${formId}-appName`}
          name="appName"
          type="text"
          required
          minLength={2}
          maxLength={200}
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-repoUrl`}>
          GitHub or GitLab repository URL <span className="text-[var(--foreground-muted)]">*</span>
        </label>
        <input
          id={`${formId}-repoUrl`}
          name="repoUrl"
          type="url"
          required
          placeholder="https://github.com/org/project"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-homepageUrl`}>
          Homepage or docs (optional)
        </label>
        <input
          id={`${formId}-homepageUrl`}
          name="homepageUrl"
          type="url"
          placeholder="https://"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-description`}>
          Description <span className="text-[var(--foreground-muted)]">*</span>
        </label>
        <textarea
          id={`${formId}-description`}
          name="description"
          required
          minLength={20}
          maxLength={8000}
          rows={6}
          placeholder="What does the project do? Why should it be listed in this catalog?"
          className={inputClass}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${formId}-license`}>
            License (if known)
          </label>
          <input
            id={`${formId}-license`}
            name="license"
            type="text"
            maxLength={80}
            placeholder="e.g. MIT, GPL-3.0, Apache-2.0"
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${formId}-categoryHint`}>
            Category / domain hint
          </label>
          <input
            id={`${formId}-categoryHint`}
            name="categoryHint"
            type="text"
            maxLength={120}
            placeholder="e.g. DevOps, Graphics, Security"
            className={inputClass}
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`${formId}-additionalNotes`}>
          Additional notes (optional)
        </label>
        <textarea
          id={`${formId}-additionalNotes`}
          name="additionalNotes"
          maxLength={8000}
          rows={3}
          placeholder="Packaging, related projects, maturity, etc."
          className={inputClass}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${formId}-submitterName`}>
            Your name (optional)
          </label>
          <input
            id={`${formId}-submitterName`}
            name="submitterName"
            type="text"
            maxLength={120}
            className={inputClass}
            autoComplete="name"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${formId}-submitterEmail`}>
            Your email <span className="text-[var(--foreground-muted)]">*</span>
          </label>
          <input
            id={`${formId}-submitterEmail`}
            name="submitterEmail"
            type="email"
            required
            className={inputClass}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Verification</span>
        {siteKey ? (
          <Turnstile
            ref={turnstileRef}
            key={turnstileKey}
            siteKey={siteKey}
            onSuccess={(token) => {
              setTurnstileToken(token);
              setMessage(null);
              setTurnstileHint(null);
              setStatus((s) => (s === "error" ? "idle" : s));
            }}
            onExpire={() => {
              setTurnstileToken(null);
              setTurnstileHint(
                "Verification expired. Complete the check again to enable Submit.",
              );
            }}
            onError={(code) => {
              setTurnstileToken(null);
              setTurnstileHint(turnstileErrorUserMessage(code));
            }}
            options={{ theme: "auto" }}
          />
        ) : (
          <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2">
            <p className="text-sm text-[var(--foreground-muted)]" role="status">
              Suggestions are temporarily unavailable.
            </p>
            {process.env.NODE_ENV !== "production" ? (
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                Admin hint: set{" "}
                <code className="rounded bg-[var(--muted)] px-1">
                  NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION
                </code>{" "}
                and{" "}
                <code className="rounded bg-[var(--muted)] px-1">
                  TURNSTILE_SECRET_KEY_PRODUCTION
                </code>{" "}
                (or the non-production key pair). On Vercel, enable those for <strong>Build</strong>{" "}
                and <strong>Runtime</strong> so the widget and API stay in sync.
              </p>
            ) : null}
          </div>
        )}
        {turnstileHint ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {turnstileHint}
          </p>
        ) : null}
        {process.env.NODE_ENV === "development" && siteKey === TURNSTILE_TEST_SITE_KEY ? (
          <p className="text-xs text-[var(--foreground-subtle)]">
            Using Cloudflare test keys locally. For production, set{" "}
            <code className="rounded bg-[var(--muted)] px-1">
              NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION
            </code>{" "}
            and{" "}
            <code className="rounded bg-[var(--muted)] px-1">
              TURNSTILE_SECRET_KEY_PRODUCTION
            </code>{" "}
            (Vercel Production), or the non-{" "}
            <code className="rounded bg-[var(--muted)] px-1">_PRODUCTION</code> pair — same widget for
            both keys; enable Build + Runtime in Vercel.
          </p>
        ) : null}
      </div>

      {status === "error" && message ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        disabled={status === "submitting" || !siteKey || !turnstileToken}
      >
        {status === "submitting" ? "Submitting…" : "Submit suggestion"}
      </Button>
    </form>
  );
}
