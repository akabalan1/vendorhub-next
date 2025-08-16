// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, signSession, sessionCookie } from "./src/lib/session-edge";

const PUBLIC_EXACT = new Set<string>([
  "/signin",
  "/invite",
  "/setup-passkey", // allow page; it validates its own preAuth cookie
  "/api/health",
]);

const PUBLIC_PREFIX = [
  "/api/auth",      // your auth helpers
  "/api/webauthn",  // passkey registration/login endpoints
  "/_next",         // next assets
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest",
  "/images",
  "/assets",
];

const DAY_MS = 24 * 60 * 60 * 1000;

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Public routes pass through
  const isPublic =
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIX.some((p) => pathname.startsWith(p));

  if (isPublic) {
    const res = NextResponse.next();
    res.headers.set("x-vendorhub-mw", "public");
    return res;
  }

  // Strict auth: any failure -> redirect to /signin
  const session = await getSessionFromRequest(req);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = ""; // rebuild to ensure proper encoding
    url.searchParams.set("callbackUrl", pathname + (search || ""));
    return NextResponse.redirect(url, { status: 307 });
  }

  // Authenticated → pass through; refresh cookie if < 1 day left
  const res = NextResponse.next();
  res.headers.set("x-vendorhub-mw", "auth");

  const expMs = (session.exp ?? 0) * 1000;
  if (expMs && expMs - Date.now() < DAY_MS) {
    const renewed = await signSession(
      { sub: session.sub, email: session.email, role: session.role },
      30
    );
    res.cookies.set(sessionCookie.name, renewed, {
      ...sessionCookie.options,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}

export const config = {
  matcher: ["/(.*)"],
};
