import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow these paths WITHOUT auth:
  // - /signin (your sign-in page)
  // - /api/auth (NextAuth callback + verification routes)
  // - /api/health (your health check)
  // - static asset paths
  const PUBLIC_PREFIXES = [
    "/signin",
    "/api/auth",
    "/api/health",
    "/_next",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ];
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Require an active session for ALL other paths (e.g., '/', '/vendor/*', '/api/vendors', '/api/feedback', etc.)
  const session = await auth();
  if (!session?.user?.email) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    // send the user back to where they were going after sign-in
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run middleware on all routes (except static/image that Next already optimizes out)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
