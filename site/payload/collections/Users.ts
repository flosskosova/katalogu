import type { CollectionConfig } from "payload";
import type { Where } from "payload";
import { adminOnlyAccess, adminOnlyField, isAdmin } from "../access";

type UserLike = { id?: string | number; role?: string };

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    /** Enables “Forgot password” on the admin login screen (email delivery needs a real adapter in production). */
    forgotPassword: {
      expiration: 60 * 60 * 1000,
    },
  },
  access: {
    /** Only admins can invite / create staff accounts from the admin UI. */
    create: adminOnlyAccess,
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdmin(user as UserLike)) return true;
      return { id: { equals: (user as UserLike).id } } as Where;
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdmin(user as UserLike)) return true;
      /** Non-admins may only update their own row (e.g. change password in the admin UI). */
      return { id: { equals: (user as UserLike).id } } as Where;
    },
    delete: adminOnlyAccess,
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
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "createdAt"],
    group: "Settings",
    description:
      "Edit **Email** to change the login address. To set a new password, fill **New password** only (leave blank to keep the current password). Admins can use **Create** to invite staff.",
  },
  fields: [
    /**
     * Merges with Payload’s auth `email` field so the login email is editable in the admin UI.
     * (Base config uses `admin.components.Field: false`, which can block editing in some setups.)
     */
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
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      access: {
        update: adminOnlyField,
      },
      admin: {
        description:
          "Only admins can change roles. Editors can add and edit Categories and Tools; publishing and other collections are limited in code.",
      },
    },
  ],
};
