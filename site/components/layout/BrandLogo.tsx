import Image from "next/image";
import { SITE_LOGO_PATH } from "@/lib/seo/site";

type Props = {
  className?: string;
  /** Larger default for header; footer can pass h-10 w-10 */
  priority?: boolean;
};

/**
 * Site wordmark graphic (dark silhouette — inverted in `prefers-color-scheme: dark`
 * so it stays visible on dark backgrounds).
 */
export function BrandLogo({ className = "h-9 w-9", priority = false }: Props) {
  return (
    <Image
      src={SITE_LOGO_PATH}
      alt=""
      width={256}
      height={256}
      sizes="(max-width: 768px) 36px, 40px"
      className={`object-contain dark:invert ${className}`}
      priority={priority}
    />
  );
}
