// middleware.ts (root)
export { auth as middleware } from "@/lib/auth";

// Keep middleware off public/framework routes
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|api/auth|api/health|signin).*)",
  ],
};
