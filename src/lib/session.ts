// src/lib/session.ts
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "vh_session";
const ISSUER = "vendorhub";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "";
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export type Session = {
  sub: string;       // Google user id
  email: string;
  name?: string;
  isAdmin?: boolean;
};

export async function signSession(
  payload: Session,
  maxAgeSec = 60 * 60 * 24 * 30 // 30 days
) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(maxAgeSec)
    .sign(secretKey());
}

export async function verifyToken(token?: string): Promise<Session | null> {
  try {
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function verifySession(): Promise<Session | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<Session | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  },
};
