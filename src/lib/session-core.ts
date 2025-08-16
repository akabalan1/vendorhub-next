// src/lib/session-core.ts
import { SignJWT, jwtVerify } from "jose";

export type Session = {
  sub: string;             // user id
  email: string;
  role?: "admin" | "user";
  exp?: number;            // seconds since epoch (from JWT)
};

export const sessionCookie = {
  name: "vh_session",
  options: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

const ISSUER = "vendorhub";
function secretKey() {
  const secret = process.env.AUTH_SECRET || "";
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: Omit<Session, "exp">, maxAgeDays = 30) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT(payload as Session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setExpirationTime(now + maxAgeDays * 24 * 60 * 60)
    .sign(secretKey());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    return payload as Session;
  } catch {
    return null;
  }
}
