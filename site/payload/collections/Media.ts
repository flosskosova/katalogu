import type { CollectionConfig } from "payload";
import { adminOnlyAccess, editorAndAdminAccess } from "../access";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumbnail", width: 400, height: 400, position: "centre" },
      { name: "card", width: 800, height: 800, position: "centre" },
    ],
    adminThumbnail: "thumbnail",
  },
  access: {
    /** Public catalog pages need anonymous reads for logos and screenshots */
    read: () => true,
    create: editorAndAdminAccess,
    update: editorAndAdminAccess,
    delete: adminOnlyAccess,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description: "Describe the image for accessibility and SEO.",
      },
    },
  ],
};
