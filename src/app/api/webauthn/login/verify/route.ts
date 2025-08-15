export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { finishAuth } from "@/lib/webauthn";
import { sessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, assertion } = await req.json();
    if (!email || !assertion) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }
    const token = await finishAuth(String(email), assertion);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(sessionCookie.name, token, {
      ...sessionCookie.options,
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to verify authentication" },
      { status: 500 }
    );
  }
}
