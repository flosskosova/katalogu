import Image from "next/image";
import { SITE_LOGO_PATH } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** When true, preload (e.g. header LCP). */
  priority?: boolean;
};

/**
 * Site mark from `SITE_LOGO_PATH` (`public/black.svg`).
 * Use **height + `w-auto`** so the mark scales without square letterboxing.
 */
export function BrandLogo({
  className = "h-16 w-auto max-h-16 sm:h-20 sm:max-h-20",
  priority = false,
}: Props) {
  return (
    <Image
      src={SITE_LOGO_PATH}
      alt=""
      width={186}
      height={153}
      sizes="(max-width: 768px) 120px, 160px"
      className={cn("block shrink-0 object-contain object-left", className)}
      priority={priority}
      unoptimized
    />
  );
}
