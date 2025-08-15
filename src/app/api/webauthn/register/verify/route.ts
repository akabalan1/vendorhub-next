export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { finishRegistration } from "@/lib/webauthn";
import { sessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, credential } = await req.json();
    if (!email || !credential) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }
    const token = await finishRegistration(String(email), credential);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(sessionCookie.name, token, {
      ...sessionCookie.options,
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to verify registration" },
      { status: 500 }
    );
  }
}
