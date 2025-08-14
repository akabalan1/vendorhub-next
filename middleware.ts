// TEMP: prove middleware is running by forcing /signin unless the path is public.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Always allow these:
  if (
    p.startsWith("/_next/") ||
    p.startsWith("/api/auth") || // NextAuth callbacks
    p === "/signin" ||
    p === "/favicon.ico" ||
    p === "/robots.txt" ||
    p === "/sitemap.xml" ||
    p === "/api/health"
  ) {
    return NextResponse.next();
  }

  // Force redirect for every other path
  const url = req.nextUrl.clone();
  url.pathname = "/signin";
  url.search = ""; // no noise
  return NextResponse.redirect(url);
}

// Run on everything
export const config = { matcher: ["/:path*"] };
