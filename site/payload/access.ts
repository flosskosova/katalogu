import type { Access, FieldAccess, PayloadRequest, Where } from "payload";

type UserLike = { id?: string | number; role?: string; collection?: string } | null | undefined;

const CTX_STAFF_ROLE = "__payloadHydratedStaffRole";

/**
 * Compare ids across string/number (Payload JWT + REST route params + DB adapters disagree often).
 */
export function sameUserId(a: unknown, b: unknown): boolean {
  if (a == null || b == null) return false;
  if (Object.is(a, b)) return true;
  if (String(a) === String(b)) return true;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) return true;
  return false;
}

/**
 * `Where` that matches the current user's row (id from JWT / session).
 */
export function whereIdEqualsUser(userId: string | number): Where {
  return { id: { equals: userId } } as Where;
}

/**
 * Resolves `role` from `req.user` or loads it from the users collection when missing on the token
 * (common after token refresh, older sessions, or when `saveToJWT` was added later).
 * Cached per request on `req.context`.
 */
export async function getStaffRole(
  req: PayloadRequest,
): Promise<string | undefined> {
  const user = req.user as UserLike;
  if (!user?.id) return undefined;
  if (user.role === "admin" || user.role === "editor") return user.role;
  if (typeof user.role === "string" && user.role.trim()) return user.role;

  const usersSlug = req.payload?.config?.admin?.user;
  const coll = user.collection ?? usersSlug;
  if (coll !== usersSlug || !req.payload) return user.role;

  const ctx = req.context as Record<string, unknown> | undefined;
  if (ctx && CTX_STAFF_ROLE in ctx) {
    return ctx[CTX_STAFF_ROLE] as string | undefined;
  }

  try {
    const doc = await req.payload.findByID({
      collection: usersSlug,
      id: user.id,
      depth: 0,
      overrideAccess: true,
      req,
    });
    const role = (doc as { role?: string } | null)?.role;
    if (req.context) {
      (req.context as Record<string, unknown>)[CTX_STAFF_ROLE] = role;
    }
    return role;
  } catch {
    return user.role;
  }
}

export async function isStaffAdmin(req: PayloadRequest): Promise<boolean> {
  return (await getStaffRole(req)) === "admin";
}

/** Sync check when `req.user.role` is known to be populated (e.g. after hydration elsewhere). */
export const isAdmin = (user: UserLike) => user?.role === "admin";
export const isEditor = (user: UserLike) =>
  user?.role === "editor" || user?.role === "admin";

/** Authenticated staff only */
export const staffAccess: Access = ({ req: { user } }) => Boolean(user);

export const adminOnlyAccess: Access = async ({ req }) =>
  (await getStaffRole(req)) === "admin";

export const editorAndAdminAccess: Access = async ({ req }) => {
  const r = await getStaffRole(req);
  return r === "editor" || r === "admin";
};

export const adminOnlyField: FieldAccess = async ({ req }) =>
  (await getStaffRole(req)) === "admin";
