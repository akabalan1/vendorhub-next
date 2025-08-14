// middleware.ts  (project root, same level as package.json)
export { auth as middleware } from "@/lib/auth";

// Run on basically everything except static/image
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
