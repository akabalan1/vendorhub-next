// middleware.ts (at repo root)
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Protect everything except these paths:
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|api/auth|api/health|signin).*)",
  ],
};
