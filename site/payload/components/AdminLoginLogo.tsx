"use client";

import Image from "next/image";
import React from "react";

/**
 * Replaces Payload’s default SVG on `/admin/login` via `admin.components.graphics.Logo`.
 * Asset: `public/admin-brand-logo.png`
 */
export function AdminLoginLogo() {
  return (
    <Image
      src="/admin-brand-logo.png"
      alt=""
      width={193}
      height={44}
      className="graphic-logo"
      style={{
        height: "auto",
        maxHeight: 44,
        width: "auto",
        maxWidth: "min(100%, 220px)",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}
