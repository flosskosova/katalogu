import { Forbidden, type PayloadRequest } from "payload";

/** Load `role` from DB (JWT/`req.user` is not reliable for permissions UI). */
export async function loadUserRoleFromDb(
  req: PayloadRequest,
  userId: string | number,
): Promise<string | undefined> {
  const slug = req.payload.config.admin.user;
  const idVariants: (string | number)[] = [userId];
  if (typeof userId === "number" && Number.isFinite(userId)) {
    idVariants.push(String(userId));
  } else if (typeof userId === "string" && /^\d+$/.test(userId)) {
    const n = Number(userId);
    if (Number.isFinite(n)) idVariants.push(n);
  }

  for (const id of idVariants) {
    try {
      const doc = await req.payload.findByID({
        collection: slug,
        id,
        depth: 0,
        overrideAccess: true,
        req,
      });
      return (doc as { role?: string } | null)?.role;
    } catch {
      /* try next id shape */
    }
  }
  return undefined;
}

/**
 * Admin check for user-management actions. Matches the idea of `GET /api/users/me`:
 * JWT `role` **or** DB row (no `req.context` cache — avoids stale `getStaffRole` during creates).
 */
export async function isRequestUserAdmin(req: PayloadRequest): Promise<boolean> {
  const u = req.user as { id?: string | number; role?: string } | undefined;
  if (!u?.id) return false;
  if (u.role === "admin") return true;
  try {
    return (await loadUserRoleFromDb(req, u.id)) === "admin";
  } catch {
    return false;
  }
}

export async function assertRequestUserIsAdmin(req: PayloadRequest): Promise<void> {
  if (!(await isRequestUserAdmin(req))) throw new Forbidden(req.t);
}

/** Admin or editor — JWT or DB, no `getStaffRole` context cache. */
export async function isRequestUserEditorOrAdmin(
  req: PayloadRequest,
): Promise<boolean> {
  const u = req.user as { id?: string | number; role?: string } | undefined;
  if (!u?.id) return false;
  if (u.role === "admin" || u.role === "editor") return true;
  try {
    const r = await loadUserRoleFromDb(req, u.id);
    return r === "admin" || r === "editor";
  } catch {
    return false;
  }
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
