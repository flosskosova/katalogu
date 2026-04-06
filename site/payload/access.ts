import type { Access, FieldAccess } from "payload";

type UserLike = { role?: string } | null | undefined;

export const isAdmin = (user: UserLike) => user?.role === "admin";
export const isEditor = (user: UserLike) =>
  user?.role === "editor" || user?.role === "admin";

/** Authenticated staff only */
export const staffAccess: Access = ({ req: { user } }) => Boolean(user);

export const adminOnlyAccess: Access = ({ req: { user } }) =>
  isAdmin(user as UserLike);

/** Editors and admins can mutate; public reads blocked at collection level */
export const editorAndAdminAccess: Access = ({ req: { user } }) =>
  isEditor(user as UserLike);

export const adminOnlyField: FieldAccess = ({ req: { user } }) =>
  isAdmin(user as UserLike);
