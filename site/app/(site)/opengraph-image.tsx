import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo/site";

export const runtime = "edge";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          padding: 72,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#f8fafc",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {SITE.name}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            color: "#94a3b8",
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          {SITE.tagline}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 20,
            color: "#64748b",
          }}
        >
          Curated · Evidence-based · Free & open source
        </div>
      </div>
    ),
    { ...size },
  );
}
