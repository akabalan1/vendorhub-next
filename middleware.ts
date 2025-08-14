// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * SUPER-VERBOSE middleware to prove it's running in Vercel Edge logs.
 * - Writes identifiable logs for every request
 * - Adds X-MW-* headers you can see in the browser Network panel
 * - Redirects to /signin when there's no @meta.com session
 */

const PUBLIC = new Set<string>([
  "/signin",
  "/api/health",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  // --- LOG: START
  // NOTE: These console.log statements show up in Vercel -> Logs -> select your deployment -> "Edge / Middleware"
  console.log(
    "[MW] HIT",
    JSON.stringify({
      path,
      method: req.method,
      ua: req.headers.get("user-agent"),
      host: req.headers.get("host"),
      country: req.geo?.country,
      ip: req.ip,
    })
  );

  // Always allow framework and public assets
  if (path.startsWith("/_next/") || path.startsWith("/api/auth")) {
    console.log("[MW] allow: framework/auth path", path);
    const res = NextResponse.next();
    res.headers.set("X-MW", "allow-framework");
    res.headers.set("X-MW-Path", path);
    return res;
  }
  if (PUBLIC.has(path)) {
    console.log("[MW] allow: public path", path);
    const res = NextResponse.next();
    res.headers.set("X-MW", "allow-public");
    res.headers.set("X-MW-Path", path);
    return res;
  }

  // Try to read the session (this uses NextAuth's edge session)
  let sessionEmail = "";
  try {
    const t0 = Date.now();
    const session = await auth();
    sessionEmail = (session?.user?.email || "").toLowerCase();
    console.log("[MW] auth() ms=", Date.now() - t0, "email=", sessionEmail || "<none>");
  } catch (e: any) {
    console.log("[MW] auth() threw", e?.message || String(e));
  }

  // Gate: must be a @meta.com email
  const ok = sessionEmail.endsWith("@meta.com");
  console.log("[MW] gate", { ok, sessionEmail });

  if (!ok) {
    const to = url.clone();
    to.pathname = "/signin";
    to.searchParams.set("callbackUrl", path + url.search);

    console.log("[MW] redirect -> /signin", { from: path, to: to.pathname + to.search });

    const res = NextResponse.redirect(to);
    res.headers.set("X-MW", "redirect-signin");
    res.headers.set("X-MW-Path", path);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("X-MW", "allow-auth");
  res.headers.set("X-MW-Path", path);
  res.headers.set("X-MW-Email", sessionEmail || "<none>");
  return res;
}

// Run on everything
export const config = { matcher: ["/:path*"] };
