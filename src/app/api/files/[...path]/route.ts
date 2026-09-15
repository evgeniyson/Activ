import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/services/auth/session";
import { getFileStorage } from "@/services/storage";

/**
 * Private file proxy. Files live under `<userId>/…`; only that user can read
 * them. This keeps photos and receipts out of public buckets.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const segments = path.map((s) => decodeURIComponent(s));
  if (segments.some((s) => s.includes("..") || s.includes("/"))) return new NextResponse("Bad request", { status: 400 });
  if (segments[0] !== user.id) return new NextResponse("Not found", { status: 404 });
  const storagePath = segments.join("/");
  const file = await getFileStorage().get(storagePath);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
