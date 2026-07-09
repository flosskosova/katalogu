"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  TOOL_LOGO_MANIFEST_URL,
  resolveToolLogoSrc,
} from "@/lib/catalog/tool-logo-shared";
import { cn } from "@/lib/utils";

function ToolLogoPlaceholder({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

const sizeClasses = {
  list: "h-9 w-9",
  card: "h-10 w-10",
  detail: "h-20 w-20",
} as const;

const pixelSizes = {
  list: 36,
  card: 40,
  detail: 80,
} as const;

let clientManifest: Record<string, string> | null = null;
let clientManifestPromise: Promise<Record<string, string>> | null = null;

function loadClientManifest(): Promise<Record<string, string>> {
  if (clientManifest) return Promise.resolve(clientManifest);
  if (!clientManifestPromise) {
    clientManifestPromise = fetch(TOOL_LOGO_MANIFEST_URL)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, string>) => {
        clientManifest = data;
        return data;
      })
      .catch(() => {
        clientManifest = {};
        return {};
      });
  }
  return clientManifestPromise;
}

export function ToolLogo({
  name,
  slug,
  logoUrl,
  size = "list",
  className,
}: {
  name: string;
  slug: string;
  logoUrl?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const [manifest, setManifest] = useState<Record<string, string> | null>(
    clientManifest,
  );

  useEffect(() => {
    if (logoUrl?.trim()) return;
    void loadClientManifest().then(setManifest);
  }, [logoUrl]);

  const src =
    logoUrl?.trim() ||
    resolveToolLogoSrc(
      { slug, logoUrl },
      manifest ?? clientManifest ?? {},
    );
  const box = sizeClasses[size];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground-muted)]",
        box,
        size === "detail" && "p-2",
        size !== "detail" && "p-1",
        className,
      )}
      aria-hidden
    >
      {src ? (
        <Image
          src={src}
          alt={size === "detail" ? `${name} logo` : ""}
          width={pixelSizes[size]}
          height={pixelSizes[size]}
          unoptimized
          className="h-full w-full object-contain"
        />
      ) : (
        <ToolLogoPlaceholder />
      )}
    </span>
  );
}
