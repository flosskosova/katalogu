import type { CollectionConfig } from "payload";
import { Forbidden } from "payload";
import {
  assertRequestUserIsAdmin,
  isRequestUserAdmin,
  sameActorAndDocId,
  whereSelfUserRow,
} from "../usersAccessHooks";

/**
 * Users / auth: **`create`** when the DB has no users (bootstrap) or when the actor is admin;
 * **`read`** / **`update`**: admins see any user, editors only their own row; **`delete`**: admin only.
 * This keeps `docPermissions` aligned with `beforeChange` / `beforeDelete`.
 * The list view hides the default Create control; admins use **Add staff user** (`/api/users/me`).
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    forgotPassword: {
      expiration: 60 * 60 * 1000,
    },
  },
  access: {
    create: async ({ req }) => {
      const slug = req.payload.config.admin.user;
      const { totalDocs } = await req.payload.count({
        collection: slug,
        req,
        overrideAccess: true,
      });
      if (totalDocs === 0) return true;
      return isRequestUserAdmin(req);
    },
    read: async ({ req }) => {
      const u = req.user as { id?: string | number } | undefined;
      if (!u?.id) return false;
      if (await isRequestUserAdmin(req)) return true;
      return whereSelfUserRow(u.id);
    },
    update: async ({ req, id }) => {
      const u = req.user as { id?: string | number } | undefined;
      if (!u?.id) return false;
      if (await isRequestUserAdmin(req)) return true;
      if (id == null) return false;
      return sameActorAndDocId(u.id, id);
    },
    delete: async ({ req }) => isRequestUserAdmin(req),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        const pwd =
          typeof data?.password === "string" ? data.password.trim() : "";
        if (operation === "create" && !pwd) {
          throw new Error("Password is required when creating a user.");
        }
        if (pwd) {
          if (pwd.length < 8) {
            throw new Error("Password must be at least 8 characters.");
          }
        }
      },
    ],
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        const slug = req.payload.config.admin.user;
        const actor = req.user as { id?: string | number } | undefined;

        if (operation === "create") {
          const { totalDocs } = await req.payload.count({
            collection: slug,
            req,
            overrideAccess: true,
          });
          if (totalDocs === 0) {
            return data;
          }
          await assertRequestUserIsAdmin(req);
          return data;
        }

        if (operation === "update" && originalDoc && data) {
          if (!actor?.id) throw new Forbidden(req.t);
          const isAdmin = await isRequestUserAdmin(req);
          const targetId = (originalDoc as { id?: string | number }).id;

          if (!isAdmin && !sameActorAndDocId(actor.id, targetId)) {
            throw new Forbidden(req.t);
          }

          if (!isAdmin) {
            const prevRole = (originalDoc as { role?: string }).role;
            if (data.role !== undefined && data.role !== prevRole) {
              return { ...data, role: prevRole };
            }
          }
        }

        return data;
      },
    ],
    beforeDelete: [
      async ({ req }) => {
        await assertRequestUserIsAdmin(req);
      },
    ],
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "createdAt"],
    group: "Settings",
    description:
      "Edit **Email** to change the login address. To set a new password, fill **New password** only (leave blank to keep the current password). Admins use **Add staff user** above the list to invite editors.",
    components: {
      beforeList: ["@/payload/components/UsersAdminList#UsersAddStaffButton"],
      views: {
        list: {
          Component: "@/payload/components/UsersAdminList#UsersListView",
        },
      },
    },
  },
  fields: [
    {
      name: "email",
      type: "email",
      label: "Email (login)",
      required: true,
      admin: {
        description:
          "Address used to sign in. After changing it, log in with the new email.",
      },
    },
    {
      name: "password",
      // @ts-expect-error — `password` field type exists at runtime for auth collections.
      type: "password",
      required: false,
      minLength: 8,
      admin: {
        description:
          "Leave empty to keep the current password. When creating a user, set a password here (min 8 characters).",
        placeholder: "New password (min 8 characters)",
      },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      saveToJWT: true,
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      access: {
        create: ({ req: { user } }) => Boolean(user),
        read: ({ req: { user } }) => Boolean(user),
        update: () => true,
      },
      admin: {
        description:
          "Only admins can change roles. Editors can add and edit Categories and Tools; publishing and other collections are limited in code.",
      },
    },
  ],
};
