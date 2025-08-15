// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest) {
  const s = await getSession();
  return NextResponse.json({ user: s });
}
