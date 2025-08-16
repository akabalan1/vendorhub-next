// /middleware.ts (root)
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

/**
 * Self-contained Edge auth gate:
 * - Verifies `vh_session` (HS256) using AUTH_SECRET
 * - Redirects unauthenticated users to /signin?callbackUrl=...
 * - Refreshes cookie when < 1 day remains
 * - No imports from app code (prevents Edge bundle failures)
 */

const COOKIE_NAME = "vh_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};
const ISSUER = "vendorhub";
const DAY_MS = 24 * 60 * 60 * 1000;


type Session = {
  sub: string;
  email: string;
  role?: "admin" | "user";
  exp?: number; // seconds since epoch
  [k: string]: any;
};

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(s);
}

async function verifyToken(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    return payload as Session;
  } catch {
    return null;
  }
}

async function reSignSession(session: Session, maxAgeDays = 30) {
  const { exp, ...payload } = session;
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setExpirationTime(now + maxAgeDays * 24 * 60 * 60)
    .sign(secretKey());
}

// Public routes allowed without auth (keep onboarding working)
const PUBLIC_EXACT = new Set<string>([
  "/signin",
  "/invite",
  "/setup-passkey",
  "/api/health",
  // add to PUBLIC_PREFIX in your middleware
  "/api/access-requests",

]);

const PUBLIC_PREFIX = [
  "/api/auth",
  "/api/webauthn",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest",
  "/images",
  "/assets",
];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isPublic =
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIX.some((p) => pathname.startsWith(p));

  if (isPublic) {
    const res = NextResponse.next();
    res.headers.set("x-vendorhub-mw", "public");
    return res;
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifyToken(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    url.searchParams.set("callbackUrl", pathname + (search || ""));
    return NextResponse.redirect(url, { status: 307 });
  }

  const res = NextResponse.next();
  res.headers.set("x-vendorhub-mw", "auth");

  // Refresh session when <1 day remains
  const expMs = (session.exp ?? 0) * 1000;
  if (expMs && expMs - Date.now() < DAY_MS) {
    const renewed = await reSignSession(session, 30);
    res.cookies.set(COOKIE_NAME, renewed, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}

/**
 * Matcher:
 * - Run on everything except common static asset paths
 * - This DOES match `/` (root)
 */
export const config = {
  matcher: ["/(.*)"],
};
