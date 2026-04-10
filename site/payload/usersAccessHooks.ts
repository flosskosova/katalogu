import { Forbidden, type PayloadRequest, type Where } from "payload";

const CTX_DB_ROLE_PREFIX = "__payloadDbStaffRole:";

/** Id shapes JWT / adapters / DB disagree on (numeric vs string, UUID case). */
function idVariantsForAccess(userId: string | number): (string | number)[] {
  const out: (string | number)[] = [userId];
  if (typeof userId === "number" && Number.isFinite(userId)) {
    out.push(String(userId));
  } else if (typeof userId === "string") {
    const t = userId.trim();
    if (/^\d+$/.test(t)) {
      const n = Number(t);
      if (Number.isFinite(n)) out.push(n);
    }
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        t,
      )
    ) {
      out.push(t.toLowerCase());
      if (t !== t.toUpperCase()) out.push(t.toUpperCase());
    }
  }
  return [...new Set(out)];
}

/**
 * `Where` for collection `read` access: non-admins may only match their own users row
 * (handles string/number/UUID shape mismatches across JWT and DB).
 */
export function whereSelfUserRow(actorId: string | number): Where {
  const variants = idVariantsForAccess(actorId);
  if (variants.length === 1) {
    return { id: { equals: variants[0] } } as Where;
  }
  return { or: variants.map((id) => ({ id: { equals: id } })) } as Where;
}

/**
 * Load `role` from DB (JWT/`req.user` is not reliable for permissions UI).
 * Uses `findByID` variants, then a `find` + `or` fallback (some adapters behave differently).
 * Cached per request on `req.context` to avoid duplicate queries on globals read+update.
 */
export async function loadUserRoleFromDb(
  req: PayloadRequest,
  userId: string | number,
): Promise<string | undefined> {
  const cacheKey = `${CTX_DB_ROLE_PREFIX}${String(userId)}`;
  const ctx = req.context as Record<string, unknown> | undefined;
  if (ctx && cacheKey in ctx) {
    return ctx[cacheKey] as string | undefined;
  }

  const slug = req.payload.config.admin.user;
  const variants = idVariantsForAccess(userId);
  let role: string | undefined;

  for (const id of variants) {
    try {
      const doc = await req.payload.findByID({
        collection: slug,
        id,
        depth: 0,
        overrideAccess: true,
        req,
      });
      role = (doc as { role?: string } | null)?.role;
      if (role) break;
    } catch {
      /* try next id shape */
    }
  }

  if (!role && variants.length > 0) {
    try {
      const { docs } = await req.payload.find({
        collection: slug,
        where: { or: variants.map((id) => ({ id: { equals: id } })) },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      });
      role = (docs[0] as { role?: string } | undefined)?.role;
    } catch {
      role = undefined;
    }
  }

  if (req.context) {
    (req.context as Record<string, unknown>)[cacheKey] = role;
  }
  return role;
}

/**
 * Admin check for user-management actions. Matches the idea of `GET /api/users/me`:
 * JWT `role` **or** DB row (`loadUserRoleFromDb` caches per request on `req.context`).
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

/** Admin or editor — JWT or DB (`loadUserRoleFromDb` caches per request). */
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
