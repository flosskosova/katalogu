import type { ReactNode } from "react";

/**
 * Payload admin cold start (DB + RSC) can exceed Hobby’s default function cap.
 * Vercel clamps this to your plan’s maximum (e.g. Hobby may cap below 300).
 */
export const maxDuration = 300;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
