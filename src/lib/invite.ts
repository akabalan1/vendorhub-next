import { SignJWT, jwtVerify } from "jose";

const ISSUER = "vendorhub-invite";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "";
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export type Invite = {
  email: string;
};

export async function signInvite(
  payload: Invite,
  maxAgeSec = 60 * 60 * 24 // 1 day
) {
  const expires = Math.floor(Date.now() / 1000) + maxAgeSec;
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secretKey());
}

export async function verifyInvite(token?: string): Promise<Invite | null> {
  try {
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    return payload as unknown as Invite;
  } catch {
    return null;
  }
}
