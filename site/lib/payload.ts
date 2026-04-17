import type { Payload } from "payload";
import { getPayload } from "payload";

import config from "@payload-config";

/**
 * One shared Payload instance per process. Home and other routes call
 * `getPayloadClient()` in parallel; without dedupe, each call races through
 * `getPayload({ config })` and Postgres errors surface as multiple
 * `unhandledRejection: undefined` lines in Next dev.
 */
let cached: Payload | undefined;
let inflight: Promise<Payload> | null = null;

export async function getPayloadClient(): Promise<Payload> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = getPayload({ config })
    .then((p) => {
      cached = p;
      inflight = null;
      return p;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}
