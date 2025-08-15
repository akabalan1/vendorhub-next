// src/app/api/auth/login/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { signSession, sessionCookie } from "@/lib/session";

const clientId =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const client = new OAuth2Client(clientId);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json(); // Google ID token
    if (!credential) {
      return NextResponse.json({ error: "Missing credential" }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const p = ticket.getPayload();
    if (!p?.email) {
      return NextResponse.json({ error: "No email in token" }, { status: 400 });
    }

    const email = p.email.toLowerCase();
    if (!email.endsWith("@meta.com") || !p.email_verified) {
      return NextResponse.json({ error: "Unauthorized domain" }, { status: 403 });
    }

    const isAdmin = ADMIN_EMAILS.includes(email);
    const token = await signSession({
      sub: p.sub!,
      email,
      name: p.name,
      isAdmin,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(sessionCookie.name, token, {
      ...sessionCookie.options,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "login failed" }, { status: 500 });
  }
}
