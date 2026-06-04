import Link from "next/link";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  default: "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]",
  accent:
    "border border-[#fff200]/55 bg-[#fff200]/50 text-[#14120f]",
  success:
    "bg-[#fff200]/14 text-[#5c5600] border border-[#fff200]/32",
  warn: "bg-[#fffce8] text-[#665e00] border border-[#efe24d]",
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
