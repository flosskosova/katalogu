import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo/site";

export const runtime = "edge";

export const alt = `${SITE.name} apple touch icon`;
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width="180"
        height="180"
      >
        <rect x="16" y="16" width="224" height="224" rx="52" fill="#111111" />
        <path
          fill="#ffffff"
          transform="translate(28 70) scale(1.212)"
          d="m 656.875,635.82379 v 8.33 l -60.33,-23.66 -6.88,23.66 h -3.12 l -5.25,-27.17 a 54.54,54.54 0 0 1 -16.25,-13.78 a 38.86,38.86 0 0 1 -8,-20.47 c -1.4,-14.23 -13.92,-15.36 -13.92,-15.36 v -2.38 c 0,0 22.46,-19.75 37.24,-1.21 a 137,137 0 0 0 10.25,11.65 c 0,0 37.1,33.87 43.43,40 z"
        />
      </svg>
    ),
    { ...size },
  );
}
