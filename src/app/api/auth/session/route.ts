// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  return NextResponse.json({ user: s });
}
