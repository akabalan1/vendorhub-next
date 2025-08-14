// middleware.ts  (MUST be at repo root, same level as package.json)
export { auth as middleware } from "@/lib/auth";

// Protect everything except the listed public paths
export const config = {
  matcher: [
    // match every path
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/auth|api/health|signin).*)",
  ],
};
