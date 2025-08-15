// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/session";

const PUBLIC_PREFIXES = [
  "/signin",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await getSession(req);

  if (process.env.AUTH_DEBUG === "1") {
    console.log("[mw]", pathname, "user:", session?.email || null);
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  const now = Math.floor(Date.now() / 1000);
  if (session.exp - now < 60 * 60 * 24 * 7) {
    const res = NextResponse.next();
    await setSessionCookie(res, {
      email: session.email,
      isAdmin: session.isAdmin,
      stage: session.stage,
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
