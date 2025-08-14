// middleware.ts  (TEMP to verify it runs)
import { NextResponse } from "next/server";

export function middleware() {
  console.log("MIDDLEWARE RAN ✅");
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
