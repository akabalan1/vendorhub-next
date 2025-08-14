import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow NextAuth, static, and public files without auth
  const publicPaths = [
    "/signin",
    "/api/auth",
    "/_next",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/api/health",
  ];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Require auth for everything else
  const session = await auth();
  if (!session?.user?.email) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Gate everything; tweak if you want only some sections protected
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
