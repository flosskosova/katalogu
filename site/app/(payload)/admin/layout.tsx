import type { ReactNode } from "react";

/** Payload admin cold start (DB + RSC) often exceeds Vercel’s ~10s default without this. */
export const maxDuration = 60;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
