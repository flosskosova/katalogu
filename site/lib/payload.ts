import type { Payload } from "payload";
import { getPayload } from "payload";

import config from "@payload-config";

/**
 * One shared Payload instance per process. Home and other routes call
 * `getPayloadClient()` in parallel; we dedupe the init promise.
 *
 * After a failed init, Payload clears its internal cached promise, so every
 * new `getPayload({ config })` would retry Postgres. That spams the dev console
 * (and can surface extra `unhandledRejection` noise). We remember a terminal
 * failure for this Node process so catalog routes fall back without reconnect
 * storms. Restart the dev server after fixing `DATABASE_URL` (or use local
 * SQLite / `USE_STATIC_CATALOG=true` — see `.env.example`).
 */
let cached: Payload | undefined;
let inflight: Promise<Payload> | null = null;
let initFailed: Error | null = null;

function normalizeInitError(err: unknown): Error {
  if (err instanceof Error && err.message) return err;
  if (err instanceof Error) return err;
  if (err != null && typeof err === "object" && "message" in err) {
    const m = String((err as { message?: unknown }).message);
    if (m) return new Error(m);
  }
  if (typeof err === "string" && err) return new Error(err);
  return new Error(
    "Payload failed to initialize (database unreachable or misconfigured)",
  );
}

export async function getPayloadClient(): Promise<Payload> {
  if (cached) return cached;
  if (initFailed) throw initFailed;
  if (inflight) return inflight;

  inflight = getPayload({ config })
    .then((p) => {
      cached = p;
      inflight = null;
      initFailed = null;
      return p;
    })
    .catch((err) => {
      inflight = null;
      initFailed = normalizeInitError(err);
      throw initFailed;
    });

  return inflight;
}
