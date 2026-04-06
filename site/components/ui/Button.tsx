import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] shadow-sm",
  secondary:
    "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]",
  ghost: "text-[var(--foreground-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
  link: "text-[var(--accent)] underline-offset-4 hover:underline focus-visible:underline",
};

export type ButtonProps = {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button({
  variant = "primary",
  className,
  children,
  href,
  target,
  rel,
  type = "button",
  ...rest
}: ButtonProps) {
  const cls = cn(base, variants[variant], className);
  if (href) {
    return (
      <Link href={href} className={cls} target={target} rel={rel} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
