"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { resolveTurnstileSiteKey } from "@/lib/suggest-tool/turnstile-public";

const siteKey = resolveTurnstileSiteKey();

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

const labelClass = "block text-sm font-medium text-[var(--foreground)]";

export function SuggestToolForm() {
  const formId = useId();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage(null);

      if (siteKey && !turnstileToken) {
        setStatus("error");
        setMessage("Please complete the verification below.");
        return;
      }

      const fd = new FormData(e.currentTarget);
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
        turnstileToken: turnstileToken ?? undefined,
      };

      setStatus("submitting");
      try {
        const res = await fetch("/api/suggest-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
          return;
        }

        if (data.ok) {
          setStatus("success");
          e.currentTarget.reset();
          setTurnstileToken(null);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Something went wrong.");
        }
      } catch (err) {
        setStatus("error");
        const msg =
          err instanceof TypeError && err.message.includes("fetch")
            ? "Could not reach the server. Check your connection and try again."
            : "Request failed. Please try again.";
        setMessage(msg);
      }
    },
    [turnstileToken],
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
        <Turnstile
          siteKey={siteKey}
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
          options={{ theme: "auto" }}
        />
        {!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY_PRODUCTION?.trim() &&
        !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() &&
        process.env.NODE_ENV === "development" ? (
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
            <code className="rounded bg-[var(--muted)] px-1">_PRODUCTION</code> pair.
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
        disabled={status === "submitting" || (Boolean(siteKey) && !turnstileToken)}
      >
        {status === "submitting" ? "Submitting…" : "Submit suggestion"}
      </Button>
    </form>
  );
}
