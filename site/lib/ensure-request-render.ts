import { connection } from "next/server";

/**
 * Next.js 15+ may still run a page during the “Generating static pages” build phase when it only
 * talks to the DB/cache (no `cookies()`, `headers()`, or `searchParams`). That can hit the default
 * **60s** static-generation cap on cold Postgres/Supabase from Vercel.
 *
 * `await connection()` opts this route out of prerender so it runs only when a request arrives.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/connection
 */
export async function ensureRequestRender(): Promise<void> {
  await connection();
}
