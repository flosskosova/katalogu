import type { CollectionConfig } from "payload";
import { adminOnlyField } from "../access";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "createdAt"],
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
        description: "Only admins can change roles after account creation.",
      },
    },
  ],
};
