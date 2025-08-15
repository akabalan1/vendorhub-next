import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { signSession, sessionCookie } from "@/lib/session";

const PUBLIC_PATHS = [
  "/signin",
  "/invite",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

const ISSUER = "vendorhub";
const DAY_MS = 24 * 60 * 60 * 1000;

async function getSession(token?: string) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "");
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    return payload as any;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/api/webauthn") || PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("vh_session")?.value;
  const session = await getSession(token);

  if (process.env.AUTH_DEBUG === "1") {
    console.log("[mw]", pathname, "user:", session?.email || null);
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  if (session.preAuth && pathname !== "/setup-passkey") {
    const url = req.nextUrl.clone();
    url.pathname = "/setup-passkey";
    return NextResponse.redirect(url);
  }

  const { exp, iat, nbf, ...data } = session as any;
  const res = NextResponse.next();

  if (typeof exp === "number" && exp * 1000 - Date.now() < 7 * DAY_MS) {
    const newToken = await signSession(data as any);
    res.cookies.set(sessionCookie.name, newToken, {
      ...sessionCookie.options,
      maxAge: 30 * 24 * 60 * 60,
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

