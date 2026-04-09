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

function mergeJwtAndDbStaffRole(
  jwtRole: string | undefined,
  dbRole: string | undefined,
): string | undefined {
  if (jwtRole === "admin" || dbRole === "admin") return "admin";
  if (jwtRole === "editor" || dbRole === "editor") return "editor";
  return dbRole ?? jwtRole;
}

/**
 * Effective staff role for permission checks: merges JWT (`saveToJWT`) with the users row.
 * Always loads the DB when the actor is a users-collection member so a DB role of `admin`
 * still applies if the token still says `editor` (until the user signs in again).
 * Cached per request on `req.context`.
 */
export async function getStaffRole(
  req: PayloadRequest,
): Promise<string | undefined> {
  const user = req.user as UserLike;
  if (!user?.id) return undefined;

  const jwtRole =
    typeof user.role === "string" && user.role.trim() ? user.role : undefined;

  const usersSlug = req.payload?.config?.admin?.user;
  const coll = user.collection ?? usersSlug;
  if (!req.payload || !usersSlug || coll !== usersSlug) {
    return jwtRole;
  }

  const ctx = req.context as Record<string, unknown> | undefined;
  if (ctx && CTX_STAFF_ROLE in ctx) {
    return mergeJwtAndDbStaffRole(
      jwtRole,
      ctx[CTX_STAFF_ROLE] as string | undefined,
    );
  }

  let dbRole: string | undefined;
  try {
    const doc = await req.payload.findByID({
      collection: usersSlug,
      id: user.id,
      depth: 0,
      overrideAccess: true,
      req,
    });
    dbRole = (doc as { role?: string } | null)?.role;
  } catch {
    dbRole = undefined;
  }
  if (req.context) {
    (req.context as Record<string, unknown>)[CTX_STAFF_ROLE] = dbRole;
  }
  return mergeJwtAndDbStaffRole(jwtRole, dbRole);
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
