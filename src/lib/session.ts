// src/lib/session.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "vh_session";
const ISSUER = "vendorhub";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 days
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

function secretKey() {
  const secret = process.env.AUTH_SECRET || "";
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export type Session = {
  email: string;
  isAdmin?: boolean;
  stage: "preAuth" | "full";
};

export async function setSessionCookie(res: NextResponse, payload: Session) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE)
    .sign(secretKey());

  res.cookies.set(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: MAX_AGE });
}

export async function getSession(
  req?: NextRequest
): Promise<(Session & { exp: number }) | null> {
  const store = req ? req.cookies : cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    return payload as unknown as Session & { exp: number };
  } catch {
    return null;
  }
}

export function clearSession(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

