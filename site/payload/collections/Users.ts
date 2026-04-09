import type { CollectionConfig } from "payload";
import { Forbidden } from "payload";
import { getStaffRole } from "../access";
import {
  assertRequestUserIsAdmin,
  sameActorAndDocId,
} from "../usersAccessHooks";

/**
 * Users / auth: `read` / `update` / `delete` stay permissive for any signed-in staff.
 * **`create` access is true for all signed-in staff** so the admin create form and API receive
 * permission; **only admins may actually create** when users already exist (`beforeChange` hook).
 * The Users list uses a custom view that hides the default Create button and shows **Add staff user**
 * for admins (role from `GET /api/users/me`, DB-backed).
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    forgotPassword: {
      expiration: 60 * 60 * 1000,
    },
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
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
          const isAdmin = (await getStaffRole(req)) === "admin";
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
