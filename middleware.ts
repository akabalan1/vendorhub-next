// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, signSession, sessionCookie } from "./src/lib/session-edge";

const PUBLIC_EXACT = new Set([
  "/signin",
  "/invite",
  "/api/health",
]);
const PUBLIC_PREFIX = ["/api/auth", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

const DAY = 24 * 60 * 60 * 1000;

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // treat public paths/prefixes as pass-through
  const isPublic =
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIX.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  // strict: any error or missing session -> redirect to signin
  const session = await getSessionFromRequest(req);
  if (!session) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  // refresh cookie if within 1 day of expiry (keeps “login once” UX)
  const res = NextResponse.next();
  const expMs = (session.exp ?? 0) * 1000;
  if (expMs && expMs - Date.now() < DAY) {
    const token = await signSession({ sub: session.sub, email: session.email, role: session.role });
    res.cookies.set(sessionCookie.name, token, { ...sessionCookie.options, maxAge: 30 * 24 * 60 * 60 });
  }
  return res;
}

export const config = {
  matcher: ["/:path*"],
};
