import Link from "next/link";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  default: "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]",
  accent: "bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]",
  success: "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-900 border border-amber-500/20",
};

const linkRing =
  "transition-[opacity,box-shadow] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]";

export function Badge({
  children,
  tone = "default",
  className,
  href,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
  /** When set, the badge is a link (e.g. to a category page). */
  href?: string;
}) {
  const styles = cn(
    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-wide",
    tones[tone],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(styles, linkRing)}>
        {children}
      </Link>
    );
  }

  return <span className={styles}>{children}</span>;
}
