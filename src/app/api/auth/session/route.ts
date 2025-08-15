// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function GET(_req: NextRequest) {
  const s = await verifySession();
  return NextResponse.json({ user: s });
}
