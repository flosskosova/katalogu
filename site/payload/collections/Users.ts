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
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "createdAt"],
    group: "Settings",
    description:
      "Admins: use Create to add staff and set Admin vs Editor. Editors may only create/edit catalog Categories and Tools (drafts). To change your password while signed in, open your user below and set a new password. If you are locked out, use Forgot password on the login page (requires email to be configured on the server).",
  },
  fields: [
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
