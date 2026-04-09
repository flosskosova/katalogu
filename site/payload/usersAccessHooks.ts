import { Forbidden, type PayloadRequest } from "payload";

import { getStaffRole } from "./access";

/** Load `role` from DB (JWT/`req.user` is not reliable for permissions UI). */
export async function loadUserRoleFromDb(
  req: PayloadRequest,
  userId: string | number,
): Promise<string | undefined> {
  const slug = req.payload.config.admin.user;
  const doc = await req.payload.findByID({
    collection: slug,
    id: userId,
    depth: 0,
    overrideAccess: true,
    req,
  });
  return (doc as { role?: string } | null)?.role;
}

export async function assertRequestUserIsAdmin(req: PayloadRequest): Promise<void> {
  const u = req.user as { id?: string | number } | undefined;
  if (!u?.id) throw new Forbidden(req.t);
  /** Prefer JWT (`saveToJWT`) when present; fall back to DB like `getStaffRole`. */
  const role = await getStaffRole(req);
  if (role !== "admin") throw new Forbidden(req.t);
}

export function sameActorAndDocId(
  actorId: string | number | undefined,
  docId: string | number | undefined,
): boolean {
  if (actorId == null || docId == null) return false;
  if (Object.is(actorId, docId)) return true;
  if (String(actorId) === String(docId)) return true;
  const na = Number(actorId);
  const nb = Number(docId);
  return !Number.isNaN(na) && !Number.isNaN(nb) && na === nb;
}
