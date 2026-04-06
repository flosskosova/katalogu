import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Enables Next.js Draft Mode after validating PREVIEW_SECRET.
 * Payload Live Preview calls this URL with type + slug.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");
  const type = searchParams.get("type") ?? "tool";

  if (!secret || secret !== process.env.PREVIEW_SECRET) {
    return new NextResponse("Invalid preview token", { status: 401 });
  }
  if (!slug) {
    return new NextResponse("Missing slug", { status: 400 });
  }

  (await draftMode()).enable();

  const path =
    type === "category"
      ? `/categories/${slug}`
      : type === "collection"
        ? `/collections/${slug}`
        : `/tools/${slug}`;

  const dest = new URL(path, request.url);
  return NextResponse.redirect(dest);
}
