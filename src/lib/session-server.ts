// src/lib/session-server.ts
import { cookies } from "next/headers";
import { sessionCookie, verifyToken, signSession, type Session } from "./session-core";

export async function getSession() {
  const token = cookies().get(sessionCookie.name)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export function clearSession() {
  cookies().set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
}

export { sessionCookie, signSession };
export type { Session };
